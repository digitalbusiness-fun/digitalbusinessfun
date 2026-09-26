CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL,
  challenge text NOT NULL,
  package_selected text NOT NULL DEFAULT 'starter',
  pricing_tier text NOT NULL,
  amount_due integer NOT NULL,
  payment_status text NOT NULL DEFAULT 'PENDING',
  status text NOT NULL DEFAULT 'PROPOSAL',
  paystack_reference text UNIQUE,
  slot_reserved_until timestamptz,
  needs_review boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending',
  channel text,
  webhook_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Atomically decide tier and reserve a campaign slot for 30 minutes
CREATE OR REPLACE FUNCTION public.create_application(
  _business text, _contact text, _email text, _phone text, _category text, _challenge text, _reference text)
RETURNS TABLE(id uuid, pricing_tier text, amount_due integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used int; tier text; amt int; new_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(4999900);
  SELECT count(*) INTO used FROM applications a
   WHERE a.pricing_tier = 'campaign'
     AND (a.payment_status = 'PAID' OR (a.payment_status = 'PENDING' AND a.slot_reserved_until > now()));
  IF used < 100 THEN tier := 'campaign'; amt := 4999900; ELSE tier := 'standard'; amt := 14999900; END IF;
  INSERT INTO applications(business_name, contact_name, email, phone, category, challenge, pricing_tier, amount_due, paystack_reference, slot_reserved_until)
  VALUES (_business, _contact, _email, _phone, _category, _challenge, tier, amt, _reference,
          CASE WHEN tier = 'campaign' THEN now() + interval '30 minutes' END)
  RETURNING applications.id INTO new_id;
  INSERT INTO payments(lead_id, reference, amount) VALUES (new_id, _reference, amt);
  RETURN QUERY SELECT new_id, tier, amt;
END $$;

-- Idempotently confirm a verified payment; re-checks campaign slots
CREATE OR REPLACE FUNCTION public.confirm_payment(_reference text, _amount integer, _channel text, _from_webhook boolean)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE app applications%ROWTYPE; paid_count int;
BEGIN
  PERFORM pg_advisory_xact_lock(4999900);
  SELECT * INTO app FROM applications WHERE paystack_reference = _reference FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF _amount <> app.amount_due THEN RETURN 'amount_mismatch'; END IF;
  IF _from_webhook THEN UPDATE payments SET webhook_verified = true WHERE reference = _reference; END IF;
  IF app.payment_status = 'PAID' THEN RETURN 'already_paid'; END IF;
  IF app.pricing_tier = 'campaign' AND (app.slot_reserved_until IS NULL OR app.slot_reserved_until < now()) THEN
    SELECT count(*) INTO paid_count FROM applications WHERE pricing_tier = 'campaign' AND payment_status = 'PAID';
    IF paid_count >= 100 THEN UPDATE applications SET needs_review = true WHERE id = app.id; END IF;
  END IF;
  UPDATE applications SET payment_status = 'PAID', status = 'WON', paid_at = now() WHERE id = app.id;
  UPDATE payments SET status = 'success', channel = _channel WHERE reference = _reference;
  RETURN 'paid';
END $$;

CREATE OR REPLACE FUNCTION public.campaign_slots_used()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM applications WHERE pricing_tier = 'campaign' AND payment_status = 'PAID'
$$;

REVOKE EXECUTE ON FUNCTION public.create_application(text,text,text,text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_payment(text,integer,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_application(text,text,text,text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_payment(text,integer,text,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.campaign_slots_used() TO anon, authenticated, service_role;