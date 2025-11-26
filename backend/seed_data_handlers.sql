-- Seed DataHandler nodes into mosaic_agent_tool_nodes table
-- Run this against your taboolabot-api database

-- 1. Get Active Users
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
    'Query active users from database',
    '["DataHandler"]',
    '[
        {
            "name": "db_source",
            "type": "options",
            "label": "Database Source",
            "options": [
                {"name": "postgres", "label": "PostgreSQL"},
                {"name": "mysql", "label": "MySQL"}
            ],
            "default": "postgres",
            "optional": false
        },
        {
            "name": "query",
            "type": "code",
            "label": "SQL Query",
            "default": "SELECT id, name, email, created_at FROM users WHERE status = :status ORDER BY created_at DESC LIMIT :limit",
            "optional": false
        },
        {
            "name": "params",
            "type": "code",
            "label": "Query Parameters (JSON)",
            "default": "{\"status\": \"active\", \"limit\": 10}",
            "optional": true
        }
    ]'::jsonb,
    '["rows", "count"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT id, name, email, created_at FROM users WHERE status = :status ORDER BY created_at DESC LIMIT :limit"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{\"status\": \"active\", \"limit\": 10}"
        }
    ]'::jsonb,
    NOW(),
    NOW()
);

-- 2. Get User Orders
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
    'Get orders for a specific user (AI provides user_id)',
    '["DataHandler"]',
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT order_id, product, amount, order_date FROM orders WHERE user_id = :user_id ORDER BY order_date DESC"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{}"
        }
    ]'::jsonb,
    '["rows", "count"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT order_id, product, amount, order_date FROM orders WHERE user_id = :user_id ORDER BY order_date DESC"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{}"
        }
    ]'::jsonb,
    NOW(),
    NOW()
);

-- 3. Search Products by Category
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
    'Search products by category (AI extracts category)',
    '["DataHandler"]',
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT id, name, price, stock FROM products WHERE category = :category AND stock > 0 ORDER BY price ASC"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{}"
        }
    ]'::jsonb,
    '["rows", "count"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT id, name, price, stock FROM products WHERE category = :category AND stock > 0 ORDER BY price ASC"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{}"
        }
    ]'::jsonb,
    NOW(),
    NOW()
);

-- 4. Get Featured Agents
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
    'Query featured agents by disabled status',
    '["DataHandler"]',
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT * FROM mosaic_ext_featured_agents WHERE disabled = :val"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{}"
        }
    ]'::jsonb,
    '["rows", "count"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    false,
    'sql',
    false,
    '[
        {
            "name": "db_source",
            "type": "options",
            "default": "postgres"
        },
        {
            "name": "query",
            "type": "code",
            "default": "SELECT * FROM mosaic_ext_featured_agents WHERE disabled = :val"
        },
        {
            "name": "params",
            "type": "code",
            "default": "{}"
        }
    ]'::jsonb,
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
