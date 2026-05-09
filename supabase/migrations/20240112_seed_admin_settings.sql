-- Seed Admin UPI Settings
INSERT INTO system_settings (key, value, description)
VALUES 
  ('admin_upi_id', 'admin@upi', 'The UPI ID where Escrow payments should be sent.'),
  ('admin_qr_url', '', 'The URL of the Admin UPI QR Code image.')
ON CONFLICT (key) DO NOTHING;
