-- Reverts 0035_email_inbox.sql -- the Gmail inbox feature was removed.
-- Safe to run whether or not 0035 was ever applied.
drop table if exists inbox_messages;
drop table if exists email_connections;
