-- Seed DataHandler nodes into mosaic_agent_tool_nodes table
-- Run this against your taboolabot-api database

-- 1. Get Active Users (has fixed default params - LLM doesn't need to provide)
INSERT INTO mosaic_agent_tool_nodes (
    node_uuid,
    user_id,
    code,
    imports,
    label,
    name,
    version,
    type,
    icon,
    category,
    description,
    base_classes,
    inputs,
    outputs,
    credential,
    file_path,
    active,
    is_used,
    is_public,
    language,
    is_verified,
    args,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    129617,  -- Your user_id
    '',  -- No Python code needed for DataHandler
    '[]',
    'Get Active Users',
    'get_active_users',
    1,
    'DataHandler',
    'Database',
    'Data Operations',
    'Query active users from database. Returns users with specified status.',
    '["DataHandler"]',
    jsonb_build_array(
        jsonb_build_object(
            'name', 'db_source',
            'type', 'options',
            'label', 'Database Source',
            'options', jsonb_build_array(
                jsonb_build_object('name', 'postgres', 'label', 'PostgreSQL'),
                jsonb_build_object('name', 'mysql', 'label', 'MySQL')
            ),
            'default', 'postgres',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query',
            'type', 'code',
            'label', 'SQL Query',
            'default', E'SELECT\n  id,\n  name,\n  email,\n  created_at\nFROM users\nWHERE status = :status\nORDER BY created_at DESC\nLIMIT :limit',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query_params',
            'type', 'code',
            'label', 'Query Parameters Schema',
            'default', '[{"name": "status", "type": "string", "description": "User status to filter by (e.g., active, inactive, pending)", "required": true}, {"name": "limit", "type": "number", "description": "Maximum number of users to return", "required": true}]',
            'optional', true
        ),
        jsonb_build_object(
            'name', 'params',
            'type', 'code',
            'label', 'Default Parameter Values',
            'default', '{"status": "active", "limit": 10}',
            'optional', true
        )
    ),
    '["output"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    jsonb_build_array(
        jsonb_build_object('name', 'db_source', 'type', 'options', 'default', 'postgres'),
        jsonb_build_object('name', 'query', 'type', 'code', 'default', E'SELECT\n  id,\n  name,\n  email,\n  created_at\nFROM users\nWHERE status = :status\nORDER BY created_at DESC\nLIMIT :limit'),
        jsonb_build_object('name', 'query_params', 'type', 'code', 'default', '[{"name": "status", "type": "string", "description": "User status to filter by (e.g., active, inactive, pending)", "required": true}, {"name": "limit", "type": "number", "description": "Maximum number of users to return", "required": true}]'),
        jsonb_build_object('name', 'params', 'type', 'code', 'default', '{"status": "active", "limit": 10}')
    ),
    NOW(),
    NOW()
);

-- 2. Get User Orders (AI must provide user_id)
INSERT INTO mosaic_agent_tool_nodes (
    node_uuid,
    user_id,
    code,
    imports,
    label,
    name,
    version,
    type,
    icon,
    category,
    description,
    base_classes,
    inputs,
    outputs,
    credential,
    file_path,
    active,
    is_used,
    is_public,
    language,
    is_verified,
    args,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    129617,
    '',
    '[]',
    'Get User Orders',
    'get_user_orders',
    1,
    'DataHandler',
    'Database',
    'Data Operations',
    'Get orders for a specific user. AI must provide the user_id parameter.',
    '["DataHandler"]',
    jsonb_build_array(
        jsonb_build_object(
            'name', 'db_source',
            'type', 'options',
            'label', 'Database Source',
            'options', jsonb_build_array(
                jsonb_build_object('name', 'postgres', 'label', 'PostgreSQL'),
                jsonb_build_object('name', 'mysql', 'label', 'MySQL')
            ),
            'default', 'postgres',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query',
            'type', 'code',
            'label', 'SQL Query',
            'default', E'SELECT\n  order_id,\n  product,\n  amount,\n  order_date\nFROM orders\nWHERE user_id = :user_id\nORDER BY order_date DESC',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query_params',
            'type', 'code',
            'label', 'Query Parameters Schema',
            'default', '[{"name": "user_id", "type": "number", "description": "The unique identifier of the user whose orders to retrieve", "required": true}]',
            'optional', true
        ),
        jsonb_build_object(
            'name', 'params',
            'type', 'code',
            'label', 'Default Parameter Values',
            'default', '{}',
            'optional', true
        )
    ),
    '["output"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    jsonb_build_array(
        jsonb_build_object('name', 'db_source', 'type', 'options', 'default', 'postgres'),
        jsonb_build_object('name', 'query', 'type', 'code', 'default', E'SELECT\n  order_id,\n  product,\n  amount,\n  order_date\nFROM orders\nWHERE user_id = :user_id\nORDER BY order_date DESC'),
        jsonb_build_object('name', 'query_params', 'type', 'code', 'default', '[{"name": "user_id", "type": "number", "description": "The unique identifier of the user whose orders to retrieve", "required": true}]'),
        jsonb_build_object('name', 'params', 'type', 'code', 'default', '{}')
    ),
    NOW(),
    NOW()
);

-- 3. Search Products by Category (AI must provide category)
INSERT INTO mosaic_agent_tool_nodes (
    node_uuid,
    user_id,
    code,
    imports,
    label,
    name,
    version,
    type,
    icon,
    category,
    description,
    base_classes,
    inputs,
    outputs,
    credential,
    file_path,
    active,
    is_used,
    is_public,
    language,
    is_verified,
    args,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    129617,
    '',
    '[]',
    'Search Products',
    'search_products',
    1,
    'DataHandler',
    'Database',
    'Data Operations',
    'Search products by category. AI must extract and provide the category from user request.',
    '["DataHandler"]',
    jsonb_build_array(
        jsonb_build_object(
            'name', 'db_source',
            'type', 'options',
            'label', 'Database Source',
            'options', jsonb_build_array(
                jsonb_build_object('name', 'postgres', 'label', 'PostgreSQL'),
                jsonb_build_object('name', 'mysql', 'label', 'MySQL')
            ),
            'default', 'postgres',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query',
            'type', 'code',
            'label', 'SQL Query',
            'default', E'SELECT\n  id,\n  name,\n  price,\n  stock\nFROM products\nWHERE category = :category\n  AND stock > 0\nORDER BY price ASC',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query_params',
            'type', 'code',
            'label', 'Query Parameters Schema',
            'default', '[{"name": "category", "type": "string", "description": "Product category to search for (e.g., electronics, clothing, books)", "required": true}]',
            'optional', true
        ),
        jsonb_build_object(
            'name', 'params',
            'type', 'code',
            'label', 'Default Parameter Values',
            'default', '{}',
            'optional', true
        )
    ),
    '["output"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    jsonb_build_array(
        jsonb_build_object('name', 'db_source', 'type', 'options', 'default', 'postgres'),
        jsonb_build_object('name', 'query', 'type', 'code', 'default', E'SELECT\n  id,\n  name,\n  price,\n  stock\nFROM products\nWHERE category = :category\n  AND stock > 0\nORDER BY price ASC'),
        jsonb_build_object('name', 'query_params', 'type', 'code', 'default', '[{"name": "category", "type": "string", "description": "Product category to search for (e.g., electronics, clothing, books)", "required": true}]'),
        jsonb_build_object('name', 'params', 'type', 'code', 'default', '{}')
    ),
    NOW(),
    NOW()
);

-- 4. Get Featured Agents (AI must provide val boolean)
INSERT INTO mosaic_agent_tool_nodes (
    node_uuid,
    user_id,
    code,
    imports,
    label,
    name,
    version,
    type,
    icon,
    category,
    description,
    base_classes,
    inputs,
    outputs,
    credential,
    file_path,
    active,
    is_used,
    is_public,
    language,
    is_verified,
    args,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    129617,
    '',
    '[]',
    'Get Featured Agents',
    'get_featured_agents',
    1,
    'DataHandler',
    'Database',
    'Data Operations',
    'Query featured agents filtered by disabled status. AI must provide true/false for the disabled filter.',
    '["DataHandler"]',
    jsonb_build_array(
        jsonb_build_object(
            'name', 'db_source',
            'type', 'options',
            'label', 'Database Source',
            'options', jsonb_build_array(
                jsonb_build_object('name', 'postgres', 'label', 'PostgreSQL'),
                jsonb_build_object('name', 'mysql', 'label', 'MySQL')
            ),
            'default', 'postgres',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query',
            'type', 'code',
            'label', 'SQL Query',
            'default', E'SELECT *\nFROM mosaic_ext_featured_agents\nWHERE disabled = :val',
            'optional', false
        ),
        jsonb_build_object(
            'name', 'query_params',
            'type', 'code',
            'label', 'Query Parameters Schema',
            'default', '[{"name": "val", "type": "boolean", "description": "Filter by disabled status. true = show disabled agents, false = show enabled agents", "required": true}]',
            'optional', true
        ),
        jsonb_build_object(
            'name', 'params',
            'type', 'code',
            'label', 'Default Parameter Values',
            'default', '{"val": true}',
            'optional', true
        )
    ),
    '["output"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    jsonb_build_array(
        jsonb_build_object('name', 'db_source', 'type', 'options', 'default', 'postgres'),
        jsonb_build_object('name', 'query', 'type', 'code', 'default', E'SELECT *\nFROM mosaic_ext_featured_agents\nWHERE disabled = :val'),
        jsonb_build_object('name', 'query_params', 'type', 'code', 'default', '[{"name": "val", "type": "boolean", "description": "Filter by disabled status. true = show disabled agents, false = show enabled agents", "required": true}]'),
        jsonb_build_object('name', 'params', 'type', 'code', 'default', '{"val": true}')
    ),
    NOW(),
    NOW()
);

-- Verify inserts
SELECT
    node_uuid,
    label,
    name,
    type,
    active
FROM mosaic_agent_tool_nodes
WHERE type = 'DataHandler'
AND user_id = 129617
ORDER BY created_at DESC;
