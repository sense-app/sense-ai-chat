// Type definitions
type Primitive = string | number | boolean | null;
type JSONValue = Primitive | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = JSONValue[];

interface FormatOptions {
  indent?: number;
  maxDepth?: number;
  throwOnMaxDepth?: boolean;
}

class FormattingError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'FormattingError';
  }
}

export const jsonToLLMFormat = (
  data: JSONValue,
  options: FormatOptions = {}
): string => {
  const {
    indent = 0,
    maxDepth = 20,
    throwOnMaxDepth = false
  } = options;

  try {
    return formatWithDepth(data, indent, 0);
  } catch (error) {
    if (error instanceof FormattingError) {
      throw error;
    }
    throw new FormattingError('Failed to format LLM output', error as Error);
  }

  function formatWithDepth(
    data: JSONValue,
    indent: number,
    depth: number
  ): string {
    // Check for max depth
    if (depth > maxDepth) {
      if (throwOnMaxDepth) {
        throw new FormattingError(`Maximum depth of ${maxDepth} exceeded`);
      }
      return `${getIndent(indent)}[Max depth exceeded]`;
    }

    // Check for circular references
    if (isCircular(data)) {
      return `${getIndent(indent)}[Circular reference detected]`;
    }

    if (Array.isArray(data)) {
      return formatArray(data, indent, depth);
    } else if (isObject(data)) {
      return formatObject(data, indent, depth);
    } else {
      return formatPrimitive(data, indent);
    }
  }

  function formatArray(
    data: JSONArray,
    indent: number,
    depth: number
  ): string {
    if (data.length === 0) {
      return `${getIndent(indent)}[]`;
    }

    // Check if it's an array of single-key objects that can be flattened
    if (
      data.length > 0 &&
      isObject(data[0]) &&
      !Array.isArray(data[0]) &&
      Object.keys(data[0]).length === 1
    ) {
      const key = Object.keys(data[0])[0];
      if (data.every(item => isObject(item) && Object.keys(item).length === 1 && key in item)) {
        return data
          .map(item => `${getIndent(indent)}${(item as JSONObject)[key]}`)
          .join('\n');
      }
    }

    return data
      .map((item, index) => {
        return `${getIndent(indent)}#${index + 1}:\n${formatWithDepth(
          item,
          indent + 1,
          depth + 1
        )}`;
      })
      .join('\n\n');
  }

  function formatObject(
    data: JSONObject,
    indent: number,
    depth: number
  ): string {
    return Object.entries(data)
      .map(([key, value]) => {
        const formattedKey = formatKey(key);
        return `${getIndent(indent)}${formattedKey}:\n${formatWithDepth(
          value,
          indent + 1,
          depth + 1
        )}`;
      })
      .join('\n');
  }

  function formatPrimitive(data: Primitive, indent: number): string {
    if (data === null) {
      return `${getIndent(indent)}null`;
    }
    return `${getIndent(indent)}${String(data)}`;
  }

  function getIndent(indent: number): string {
    return '  '.repeat(indent);
  }

  function formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  function isObject(value: unknown): value is JSONObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function isCircular(obj: unknown): boolean {
    try {
      JSON.stringify(obj);
      return false;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('circular')) {
        return true;
      }
      throw error;
    }
  }
};