/**
 * Schema Parser
 * 
 * Converts OpenAPI/JSON schemas from Replicate model versions into
 * form field configurations for dynamic UI generation
 */

import { JSONSchema, FormField, FormFieldType } from '@/types';

/**
 * Parse an OpenAPI input schema into form field configurations
 */
export function parseInputSchema(schema: JSONSchema | null | undefined): FormField[] {
  if (!schema || !schema.properties) {
    return [];
  }

  const fields: FormField[] = [];
  const required = new Set(schema.required || []);

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    if (!propSchema) continue;

    const field = parseProperty(name, propSchema, required.has(name));
    if (field) {
      fields.push(field);
    }
  }

  // Sort by x-order if present, otherwise maintain original order
  return fields.sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    return orderA - orderB;
  });
}

/**
 * Parse a single schema property into a form field
 */
function parseProperty(
  name: string,
  schema: JSONSchema,
  required: boolean
): FormField | null {
  // Resolve allOf, anyOf, oneOf
  const resolvedSchema = resolveCompositeSchema(schema);
  
  const baseField: Partial<FormField> = {
    name,
    label: formatLabel(resolvedSchema.title || name),
    description: resolvedSchema.description,
    required,
    default: resolvedSchema.default,
    order: resolvedSchema['x-order'],
    schema: resolvedSchema,
  };

  // Determine field type based on schema
  const fieldType = determineFieldType(resolvedSchema);
  
  switch (fieldType) {
    case 'select':
      return {
        ...baseField,
        type: 'select',
        options: (resolvedSchema.enum || []).map(value => ({
          label: formatEnumLabel(String(value)),
          value,
        })),
      } as FormField;

    case 'slider':
      return {
        ...baseField,
        type: 'slider',
        min: resolvedSchema.minimum ?? 0,
        max: resolvedSchema.maximum ?? 100,
        step: determineStep(resolvedSchema),
      } as FormField;

    case 'number':
      return {
        ...baseField,
        type: 'number',
        min: resolvedSchema.minimum,
        max: resolvedSchema.maximum,
        step: determineStep(resolvedSchema),
      } as FormField;

    case 'boolean':
      return {
        ...baseField,
        type: 'boolean',
        default: resolvedSchema.default ?? false,
      } as FormField;

    case 'file':
      return {
        ...baseField,
        type: 'file',
        accept: determineFileAccept(name, resolvedSchema),
      } as FormField;

    case 'textarea':
      return {
        ...baseField,
        type: 'textarea',
      } as FormField;

    case 'array':
      return {
        ...baseField,
        type: 'array',
      } as FormField;

    case 'json':
      return {
        ...baseField,
        type: 'json',
      } as FormField;

    case 'text':
    default:
      return {
        ...baseField,
        type: 'text',
      } as FormField;
  }
}

/**
 * Resolve composite schemas (allOf, anyOf, oneOf)
 */
function resolveCompositeSchema(schema: JSONSchema): JSONSchema {
  if (schema.allOf && schema.allOf.length > 0) {
    // Merge all schemas in allOf
    return schema.allOf.reduce((merged, subSchema) => ({
      ...merged,
      ...subSchema,
    }), { ...schema, allOf: undefined });
  }

  if (schema.anyOf && schema.anyOf.length > 0) {
    // Take first option for simplicity
    return { ...schema, ...schema.anyOf[0], anyOf: undefined };
  }

  if (schema.oneOf && schema.oneOf.length > 0) {
    // Take first option for simplicity
    return { ...schema, ...schema.oneOf[0], oneOf: undefined };
  }

  return schema;
}

/**
 * Determine the appropriate form field type from schema
 */
function determineFieldType(schema: JSONSchema): FormFieldType {
  // Check for enum first - these become selects
  if (schema.enum && schema.enum.length > 0) {
    return 'select';
  }

  // Check format for file uploads
  if (schema.format === 'uri' && isFileField(schema)) {
    return 'file';
  }

  // Handle by type
  switch (schema.type) {
    case 'integer':
    case 'number':
      // Use slider if we have both min and max
      if (schema.minimum !== undefined && schema.maximum !== undefined) {
        return 'slider';
      }
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'string':
      // Check if it's a long text field
      if (isTextAreaField(schema)) {
        return 'textarea';
      }
      // Check for file URI
      if (schema.format === 'uri') {
        return 'file';
      }
      return 'text';

    case 'array':
      return 'array';

    case 'object':
      return 'json';

    default:
      // Try to infer from default value
      if (typeof schema.default === 'boolean') {
        return 'boolean';
      }
      if (typeof schema.default === 'number') {
        return 'number';
      }
      return 'text';
  }
}

/**
 * Check if a field should be rendered as a file upload
 */
function isFileField(schema: JSONSchema): boolean {
  const description = (schema.description || '').toLowerCase();
  const title = (schema.title || '').toLowerCase();
  
  const fileKeywords = ['image', 'file', 'upload', 'audio', 'video', 'photo', 'picture'];
  return fileKeywords.some(keyword => 
    description.includes(keyword) || title.includes(keyword)
  );
}

/**
 * Check if a field should be rendered as a textarea
 */
function isTextAreaField(schema: JSONSchema): boolean {
  const name = (schema.title || '').toLowerCase();
  const description = (schema.description || '').toLowerCase();
  
  // Check max length - longer fields should be textareas
  if (schema.maxLength && schema.maxLength > 200) {
    return true;
  }
  
  // Check for prompt-like fields
  const textareaKeywords = ['prompt', 'text', 'message', 'content', 'description', 'caption', 'negative'];
  return textareaKeywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword)
  );
}

/**
 * Determine step value for numeric inputs
 */
function determineStep(schema: JSONSchema): number {
  // If integer type, step is 1
  if (schema.type === 'integer') {
    return 1;
  }

  // Infer from min/max range
  if (schema.minimum !== undefined && schema.maximum !== undefined) {
    const range = schema.maximum - schema.minimum;
    if (range <= 1) return 0.01;
    if (range <= 10) return 0.1;
    if (range <= 100) return 1;
    return Math.round(range / 100);
  }

  // Default for floats
  return 0.1;
}

/**
 * Determine file accept attribute based on field context
 */
function determineFileAccept(name: string, schema: JSONSchema): string {
  const combined = `${name} ${schema.description || ''} ${schema.title || ''}`.toLowerCase();
  
  if (combined.includes('audio') || combined.includes('sound') || combined.includes('music')) {
    return 'audio/*';
  }
  if (combined.includes('video') || combined.includes('movie')) {
    return 'video/*';
  }
  if (combined.includes('image') || combined.includes('photo') || combined.includes('picture')) {
    return 'image/*';
  }
  
  // Default to images as most common
  return 'image/*,video/*,audio/*';
}

/**
 * Format a schema property name into a human-readable label
 */
function formatLabel(name: string): string {
  return name
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, ' ')
    // Add space before capital letters (camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Capitalize first letter of each word
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

/**
 * Format enum value into a readable label
 */
function formatEnumLabel(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

/**
 * Infer output type from schema for display purposes
 */
export function inferOutputType(schema: JSONSchema | null | undefined): 
  'image' | 'video' | 'audio' | 'text' | 'json' | 'array' | 'unknown' {
  if (!schema) return 'unknown';

  const resolvedSchema = resolveCompositeSchema(schema);
  
  // Check format hints
  if (resolvedSchema.format === 'uri') {
    const description = (resolvedSchema.description || '').toLowerCase();
    const title = (resolvedSchema.title || '').toLowerCase();
    
    if (description.includes('image') || title.includes('image')) return 'image';
    if (description.includes('video') || title.includes('video')) return 'video';
    if (description.includes('audio') || title.includes('audio')) return 'audio';
    
    // URI could be image by default for many models
    return 'image';
  }

  // Check by type
  switch (resolvedSchema.type) {
    case 'string':
      return 'text';
    case 'array':
      // Check items type
      if (resolvedSchema.items?.format === 'uri') {
        return 'image'; // Array of image URIs is common
      }
      return 'array';
    case 'object':
      return 'json';
    default:
      return 'unknown';
  }
}

/**
 * Get default values from schema
 */
export function getSchemaDefaults(schema: JSONSchema | null | undefined): Record<string, unknown> {
  if (!schema || !schema.properties) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  
  for (const [name, propSchema] of Object.entries(schema.properties)) {
    if (propSchema && propSchema.default !== undefined) {
      defaults[name] = propSchema.default;
    }
  }

  return defaults;
}

/**
 * Validate input against schema (basic validation)
 */
export function validateInput(
  input: Record<string, unknown>,
  schema: JSONSchema | null | undefined
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema || !schema.properties) {
    return { valid: true, errors };
  }

  // Check required fields
  const required = new Set(schema.required || []);
  for (const field of required) {
    if (input[field] === undefined || input[field] === null || input[field] === '') {
      errors.push(`${formatLabel(field)} is required`);
    }
  }

  // Check types and constraints
  for (const [name, propSchema] of Object.entries(schema.properties)) {
    if (!propSchema) continue;
    
    const value = input[name];
    if (value === undefined || value === null) continue;

    // Check enum values
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      errors.push(`${formatLabel(name)} must be one of: ${propSchema.enum.join(', ')}`);
    }

    // Check numeric constraints
    if (typeof value === 'number') {
      if (propSchema.minimum !== undefined && value < propSchema.minimum) {
        errors.push(`${formatLabel(name)} must be at least ${propSchema.minimum}`);
      }
      if (propSchema.maximum !== undefined && value > propSchema.maximum) {
        errors.push(`${formatLabel(name)} must be at most ${propSchema.maximum}`);
      }
    }

    // Check string constraints
    if (typeof value === 'string') {
      if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
        errors.push(`${formatLabel(name)} must be at least ${propSchema.minLength} characters`);
      }
      if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
        errors.push(`${formatLabel(name)} must be at most ${propSchema.maxLength} characters`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
