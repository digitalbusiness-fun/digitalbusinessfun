CREATE TABLE public.onboarding_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  access_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  business_identity jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_channels jsonb NOT NULL DEFAULT '{}'::jsonb,
  goals_audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_assets jsonb NOT NULL DEFAULT '{}'::jsonb,
  structure_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_case_study boolean NOT NULL DEFAULT false,
  consent_public_media boolean NOT NULL DEFAULT false,
  steps_completed int[] NOT NULL DEFAULT '{}',
  completion_status text NOT NULL DEFAULT 'NOT_STARTED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.onboarding_intake TO service_role;
ALTER TABLE public.onboarding_intake ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'lovable-ai',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracted_summary jsonb,
  recommended_tier text,
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_chat_sessions TO service_role;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.confirm_payment(_reference text, _amount integer, _channel text, _from_webhook boolean)
 RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
  INSERT INTO onboarding_intake(lead_id, business_identity)
    VALUES (app.id, jsonb_build_object('name', app.business_name, 'category', app.category))
    ON CONFLICT (lead_id) DO NOTHING;
  RETURN 'paid';
END $function$;