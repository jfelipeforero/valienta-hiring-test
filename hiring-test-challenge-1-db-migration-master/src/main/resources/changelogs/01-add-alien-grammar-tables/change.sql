CREATE TABLE type (
  id UUID PRIMARY KEY NOT NULL,
  value TEXT NOT NULL UNIQUE
);
CREATE TABLE alien (
  id UUID PRIMARY KEY NOT NULL,
  value TEXT NOT NULL UNIQUE
);
CREATE TABLE message (
  id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL,
  valid TEXT NOT NULL,
  typeId UUID DEFAULT NULL,
  alienleaderId UUID DEFAULT NULL,
  CONSTRAINT FK_message_type FOREIGN KEY (typeId) REFERENCES type (id),
  CONSTRAINT FK_message_alien FOREIGN KEY (alienleaderId) REFERENCES alien (id)
);
INSERT INTO
  type(id, value)
VALUES
  ('ed2a7e06-8798-4bae-b655-c62fe6e91ace', 'INFO'),
  (
    '768731af-563f-4ba4-bf98-946d29a9170a',
    'WARNING'
  ),
  ('b76a4e3d-f04d-4714-8d54-1c7dd1b50db4', 'DANGER');
INSERT INTO
  alien(id, value)
VALUES
  ('4a2d4fdc-9e48-46f4-80ea-7532462b98ae', 'B'),
  ('5ad1c305-5f27-4686-934f-8eb0000ff91e', 'C'),
  ('5d4fc74e-cfca-4470-99ad-5daad65501bf', 'D'),
  ('61a4780e-777f-4a5e-aab6-852f6fb13af4', 'F'),
  ('fb9fd09f-a2b9-46ba-aaac-48f3c53e97f3', 'G'),
  ('713b395b-9bd8-4543-a17e-6c7e6e9575d6', 'H'),
  ('65f2f7d6-9a23-4836-89e9-db13c8212d4d', 'J'),
  ('21a5b7c8-709b-41a7-b890-e0a85247e8bb', 'K'),
  ('97d2cf7e-645f-45e6-8ffa-07af0480ce9f', 'L'),
  ('cb8d30f4-a88f-4349-ac2a-bfac86398e40', 'M'),
  ('402c8b05-b1d9-41de-917c-638a80084315', 'N'),
  ('1480a0eb-1cfa-4bb2-9f4d-20ebe35d5058', 'P'),
  ('3843d930-9eff-46d4-a5cd-26bdaa095f45', 'Q'),
  ('eacb6d51-7ac2-419b-8c6c-8aa0dae0980b', 'R'),
  ('196f0b29-093e-416a-8bb4-015280d123a0', 'S'),
  ('92ab447d-8738-4224-9db9-d342a0a38ba8', 'T'),
  ('c67ad7e5-f8ee-46e0-9581-aa01ef57621e', 'V'),
  ('d7d697e0-49d5-4ef5-a674-91983a0ee7a7', 'W'),
  ('178684a2-75da-4e61-a0bc-b26116a6e74d', 'X'),
  ('5f9ae0ee-93c0-479d-a8c8-615d04e66058', 'Y'),
  ('e95cd4ee-4f61-48ec-b874-df01604d1748', 'Z');