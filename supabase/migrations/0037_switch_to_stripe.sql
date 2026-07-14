-- Switches the payment processor from Paddle to Stripe. No live Paddle
-- subscriptions existed yet (domain was never approved), so this is a clean
-- column swap rather than a data migration.
alter table practices drop column if exists paddle_customer_id;
alter table practices drop column if exists paddle_subscription_id;
alter table practices add column if not exists stripe_customer_id text;
alter table practices add column if not exists stripe_subscription_id text;
