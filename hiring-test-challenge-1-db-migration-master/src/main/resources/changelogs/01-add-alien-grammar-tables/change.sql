CREATE TABLE message (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    text TEXT NOT NULL
);

CREATE TABLE type (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    value TEXT NOT NULL UNIQUE
);

CREATE TABLE alien (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    value TEXT NOT NULL UNIQUE
)

-- Load inital values
INSERT INTO type(value)
VALUES ('INFO'),
    ('WARNING'),
    ('DANGER');
