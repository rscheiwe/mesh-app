-- Calculator Tool for mosaic_agent_tool_nodes
-- This tool can add, subtract, multiply, or divide two numbers

INSERT INTO public.mosaic_agent_tool_nodes (
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
    args
) VALUES (
    gen_random_uuid(),
    129617,
    E'def calculator(a: float, b: float, operation: str = "add") -> dict:\n    """Perform basic arithmetic operations.\n    \n    Args:\n        a: First number\n        b: Second number\n        operation: Operation to perform (add, subtract, multiply, divide)\n    \n    Returns:\n        dict with result and operation performed\n    """\n    if operation == "add":\n        result = a + b\n    elif operation == "subtract":\n        result = a - b\n    elif operation == "multiply":\n        result = a * b\n    elif operation == "divide":\n        if b == 0:\n            return {"error": "Cannot divide by zero"}\n        result = a / b\n    else:\n        return {"error": f"Unknown operation: {operation}"}\n    \n    return {\n        "result": result,\n        "operation": operation,\n        "a": a,\n        "b": b\n    }',
    '[]'::jsonb,
    'Calculator',
    'calculator',
    1,
    'Tool',
    'Calculator',
    'Tools',
    'Perform basic arithmetic operations (add, subtract, multiply, divide)',
    '["Tool", "StructuredTool"]'::jsonb,
    '[
        {
            "name": "a",
            "type": "number",
            "label": "First Number",
            "placeholder": "10",
            "optional": false,
            "description": "First number for the operation"
        },
        {
            "name": "b",
            "type": "number",
            "label": "Second Number",
            "placeholder": "5",
            "optional": false,
            "description": "Second number for the operation"
        },
        {
            "name": "operation",
            "type": "options",
            "label": "Operation",
            "default": "add",
            "optional": true,
            "options": [
                {"name": "add", "label": "Add (+)"},
                {"name": "subtract", "label": "Subtract (-)"},
                {"name": "multiply", "label": "Multiply (x)"},
                {"name": "divide", "label": "Divide (÷)"}
            ],
            "description": "Arithmetic operation to perform"
        }
    ]'::jsonb,
    '["result", "operation", "a", "b"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    true,
    'python',
    true,
    '[
        {
            "name": "a",
            "type": "number",
            "label": "First Number",
            "placeholder": "10",
            "optional": false
        },
        {
            "name": "b",
            "type": "number",
            "label": "Second Number",
            "placeholder": "5",
            "optional": false
        },
        {
            "name": "operation",
            "type": "options",
            "label": "Operation",
            "default": "add",
            "optional": true,
            "options": [
                {"name": "add", "label": "Add (+)"},
                {"name": "subtract", "label": "Subtract (-)"},
                {"name": "multiply", "label": "Multiply (×)"},
                {"name": "divide", "label": "Divide (÷)"}
            ]
        }
    ]'::jsonb
);

-- String Processor Tool - uppercase, lowercase, reverse, length
INSERT INTO public.mosaic_agent_tool_nodes (
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
    args
) VALUES (
    gen_random_uuid(),
    129617,
    E'def string_processor(text: str, operation: str = "uppercase") -> dict:\n    """Process text strings.\n    \n    Args:\n        text: Input text to process\n        operation: Operation to perform (uppercase, lowercase, reverse, length, word_count)\n    \n    Returns:\n        dict with processed result\n    """\n    if operation == "uppercase":\n        result = text.upper()\n    elif operation == "lowercase":\n        result = text.lower()\n    elif operation == "reverse":\n        result = text[::-1]\n    elif operation == "length":\n        result = len(text)\n    elif operation == "word_count":\n        result = len(text.split())\n    else:\n        return {"error": f"Unknown operation: {operation}"}\n    \n    return {\n        "result": result,\n        "operation": operation,\n        "original": text\n    }',
    '[]'::jsonb,
    'String Processor',
    'string_processor',
    1,
    'Tool',
    'Type',
    'Tools',
    'Process text strings (uppercase, lowercase, reverse, length, word count)',
    '["Tool", "StructuredTool"]'::jsonb,
    '[
        {
            "name": "text",
            "type": "string",
            "label": "Text",
            "placeholder": "Hello World",
            "optional": false,
            "description": "Text to process"
        },
        {
            "name": "operation",
            "type": "options",
            "label": "Operation",
            "default": "uppercase",
            "optional": true,
            "options": [
                {"name": "uppercase", "label": "Uppercase"},
                {"name": "lowercase", "label": "Lowercase"},
                {"name": "reverse", "label": "Reverse"},
                {"name": "length", "label": "Length"},
                {"name": "word_count", "label": "Word Count"}
            ],
            "description": "String operation to perform"
        }
    ]'::jsonb,
    '["result", "operation", "original"]'::jsonb,
    '{}'::jsonb,
    '',
    true,
    false,
    true,
    'python',
    true,
    '[
        {
            "name": "text",
            "type": "string",
            "label": "Text",
            "placeholder": "Hello World",
            "optional": false
        },
        {
            "name": "operation",
            "type": "options",
            "label": "Operation",
            "default": "uppercase",
            "optional": true,
            "options": [
                {"name": "uppercase", "label": "Uppercase"},
                {"name": "lowercase", "label": "Lowercase"},
                {"name": "reverse", "label": "Reverse"},
                {"name": "length", "label": "Length"},
                {"name": "word_count", "label": "Word Count"}
            ]
        }
    ]'::jsonb
);
