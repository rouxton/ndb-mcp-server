/**
 * Utility functions for NDB MCP Server
 */

/**
 * Format response data for display
 */
export function formatResponse(data: any): string {
  if (typeof data === 'string') {
    return data;
  }
  
  if (data === null || data === undefined) {
    return 'No data returned';
  }
  
  // For arrays, provide summary and detailed view
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return 'No items found';
    }
    
    // Provide summary for large arrays
    if (data.length > 10) {
      const summary = `Found ${data.length} items. Showing first 10:\n\n`;
      const items = data.slice(0, 10).map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          return formatObjectSummary(item, index + 1);
        }
        return `${index + 1}. ${item}`;
      }).join('\n');
      
      return summary + items + `\n\n... and ${data.length - 10} more items`;
    }
    
    // For smaller arrays, show all items
    const items = data.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return formatObjectSummary(item, index + 1);
      }
      return `${index + 1}. ${item}`;
    }).join('\n');
    
    return `Found ${data.length} items:\n\n${items}`;
  }
  
  // For objects, format nicely
  if (typeof data === 'object') {
    return formatObjectDetailed(data);
  }
  
  return JSON.stringify(data, null, 2);
}

/**
 * Format object summary for lists
 */
function formatObjectSummary(obj: any, index?: number): string {
  const prefix = index ? `${index}. ` : '';
  
  // Common patterns for NDB objects
  if (obj.id && obj.name) {
    const status = obj.status ? ` (${obj.status})` : '';
    const type = obj.type ? ` [${obj.type}]` : '';
    return `${prefix}${obj.name}${type}${status} - ID: ${obj.id}`;
  }
  
  if (obj.name) {
    const status = obj.status ? ` (${obj.status})` : '';
    return `${prefix}${obj.name}${status}`;
  }
  
  if (obj.id) {
    const status = obj.status ? ` (${obj.status})` : '';
    return `${prefix}ID: ${obj.id}${status}`;
  }
  
  // Fallback to first few fields
  const keys = Object.keys(obj).slice(0, 3);
  const summary = keys.map(key => `${key}: ${obj[key]}`).join(', ');
  return `${prefix}${summary}`;
}

/**
 * Format object with detailed information
 */
function formatObjectDetailed(obj: any): string {
  if (!obj || typeof obj !== 'object') {
    return String(obj);
  }
  
  // Handle special NDB response structures
  if (obj.workId && obj.operationId) {
    return formatTaskResponse(obj);
  }
  
  if (obj.capability && obj.timeMachineId) {
    return formatTimeMachineCapability(obj);
  }
  
  // Group related fields for better readability
  const sections = groupObjectFields(obj);
  
  let result = '';
  for (const [sectionName, fields] of Object.entries(sections)) {
    if (fields.length > 0) {
      result += `\n${sectionName}:\n`;
      result += fields.map(([key, value]) => `  ${key}: ${formatValue(value)}`).join('\n');
      result += '\n';
    }
  }
  
  return result.trim();
}

/**
 * Format task/operation response
 */
function formatTaskResponse(task: any): string {
  let result = `🔄 Operation: ${task.name || 'Unnamed Operation'}\n`;
  result += `📋 Work ID: ${task.workId}\n`;
  result += `🆔 Operation ID: ${task.operationId}\n`;
  result += `📊 Status: ${task.status || 'Unknown'}\n`;
  
  if (task.entityName && task.entityType) {
    result += `🎯 Target: ${task.entityName} (${task.entityType})\n`;
  }
  
  if (task.message) {
    result += `💬 Message: ${task.message}\n`;
  }
  
  if (task.associatedOperations && task.associatedOperations.length > 0) {
    result += `\n🔗 Associated Operations:\n`;
    task.associatedOperations.forEach((op: any, index: number) => {
      result += `  ${index + 1}. ${op.name} (${op.status})\n`;
    });
  }
  
  return result;
}

/**
 * Format time machine capability response
 */
function formatTimeMachineCapability(capability: any): string {
  let result = `⏰ Time Machine Capability\n`;
  result += `🆔 Time Machine ID: ${capability.timeMachineId}\n`;
  result += `🌍 Time Zone: ${capability.outputTimeZone || 'UTC'}\n`;
  result += `📈 Type: ${capability.type || 'Unknown'}\n`;
  
  if (capability.logCatchupStartTime) {
    result += `📅 Log Catchup Start: ${capability.logCatchupStartTime}\n`;
  }
  
  if (capability.overallContinuousRangeEndTime) {
    result += `📅 Continuous Range End: ${capability.overallContinuousRangeEndTime}\n`;
  }
  
  if (capability.lastContinuousSnapshotTime) {
    result += `📸 Last Snapshot: ${capability.lastContinuousSnapshotTime}\n`;
  }
  
  if (capability.healWithResetCapability) {
    result += `🔧 Heal in Progress: Yes\n`;
  }
  
  if (capability.capability && Array.isArray(capability.capability)) {
    result += `\n📊 Recovery Capability (${capability.capability.length} periods):\n`;
    capability.capability.forEach((period: any, index: number) => {
      if (period.snapshots && period.snapshots.length > 0) {
        result += `  Period ${index + 1}: ${period.snapshots.length} snapshots\n`;
      }
    });
  }
  
  return result;
}

/**
 * Group object fields into logical sections
 */
function groupObjectFields(obj: any): Record<string, [string, any][]> {
  const sections: Record<string, [string, any][]> = {
    'Basic Information': [],
    'Status & Timestamps': [],
    'Configuration': [],
    'Relationships': [],
    'Metadata': [],
    'Other': []
  };
  
  const basicFields = ['id', 'name', 'description', 'type', 'databaseType', 'engineType'];
  const statusFields = ['status', 'state', 'dateCreated', 'dateModified', 'dateSubmitted', 'startTime', 'endTime'];
  const configFields = ['clustered', 'clone', 'eraCreated', 'systemProfile', 'version', 'size'];
  const relationshipFields = ['ownerId', 'nxClusterId', 'timeMachineId', 'dbserverId', 'parentId'];
  const metadataFields = ['tags', 'properties', 'info', 'metadata'];
  
  for (const [key, value] of Object.entries(obj)) {
    if (basicFields.includes(key)) {
      sections['Basic Information'].push([key, value]);
    } else if (statusFields.includes(key)) {
      sections['Status & Timestamps'].push([key, value]);
    } else if (configFields.includes(key)) {
      sections['Configuration'].push([key, value]);
    } else if (relationshipFields.includes(key)) {
      sections['Relationships'].push([key, value]);
    } else if (metadataFields.includes(key)) {
      sections['Metadata'].push([key, value]);
    } else {
      sections['Other'].push([key, value]);
    }
  }
  
  return sections;
}

/**
 * Format individual values appropriately
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'string') {
    // Format timestamps
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return value;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    // If array contains only primitives, join as before
    if (value.every(item => (typeof item !== 'object' || item === null))) {
      if (value.length <= 3) {
        return `[${value.join(', ')}]`;
      }
      return `[${value.length} items: ${value.slice(0, 2).join(', ')}...]`;
    }
    // If array contains objects, pretty print each item
    return '[\n' + value.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        // Indent nested objects for readability
        const formatted = JSON.stringify(item, null, 2).replace(/^/gm, '  ');
        return `  [${idx}]:\n${formatted}`;
      }
      return `  [${idx}]: ${String(item)}`;
    }).join(',\n') + '\n]';
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return '{}';
    }
    if (keys.length <= 3) {
      return `{${keys.join(', ')}}`;
    }
    return `{${keys.length} properties}`;
  }
  
  return String(value);
}

/**
 * Parse JSON argument from tool call
 */
export function parseJsonArgument(arg: any): any {
  if (typeof arg === 'string') {
    try {
      return JSON.parse(arg);
    } catch {
      return arg;
    }
  }
  return arg;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string for logging (remove sensitive data)
 */
export function sanitizeForLogging(str: string): string {
  // Remove potential passwords, tokens, etc.
  return str
    .replace(/password['":\s]*['"](.*?)['"]/, 'password":"***"')
    .replace(/token['":\s]*['"](.*?)['"]/, 'token":"***"')
    .replace(/secret['":\s]*['"](.*?)['"]/, 'secret":"***"')
    .replace(/key['":\s]*['"](.*?)['"]/, 'key":"***"');
}

/**
 * Convert bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convert duration to human readable format
 */
export function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationMs = end.getTime() - start.getTime();
  
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  
  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.statusText) {
    return `HTTP ${error.response.status}: ${error.response.statusText}`;
  }
  
  return 'Unknown error occurred';
}

/**
 * Advanced filtering utility for arrays of objects, supporting nested properties (e.g. versions.name, databases.length)
 * Used by list_dbservers, list_profiles, and can be reused elsewhere.
 *
 * @param {Array} arr - Array of objects to filter
 * @param {string} valueType - Comma-separated list of fields (e.g. "name,versions.length,versions.published")
 * @param {string} value - Comma-separated list of values (e.g. "*prod*,>=2,true")
 * @returns {Array} Filtered array
 */
export function advancedFilter(arr: any[], valueType?: string, value?: string): any[] {
  if (!Array.isArray(arr) || !valueType || !value) return arr;
  const keys = valueType.split(',').map((k: string) => k.trim());
  const values = value.split(',').map((v: string) => v.trim());
  return arr.filter((item: any) =>
    keys.every((key: string, idx: number) => {
      const val = values[idx];
      // Special case: properties.<propertyName> means search in properties array for name=<propertyName> and compare value
      if (key.startsWith('properties.') && key.split('.').length === 2) {
        const propName = key.split('.')[1];
        if (!Array.isArray(item.properties)) return false;
        return item.properties.some((prop: any) => {
          if (!prop.name || prop.name.toLowerCase() !== propName.toLowerCase()) return false;
          const propVal = prop.value;
          if (val.startsWith('!')) return String(propVal) !== val.substring(1);
          if (val.startsWith('>=')) return propVal >= val.substring(2);
          if (val.startsWith('<=')) return propVal <= val.substring(2);
          if (val.startsWith('>')) return propVal > val.substring(1);
          if (val.startsWith('<')) return propVal < val.substring(1);
          if (val.startsWith('*') && val.endsWith('*')) {
            const search = val.slice(1, -1).toLowerCase();
            return String(propVal).toLowerCase().includes(search);
          }
          return String(propVal) === val;
        });
      }
      // Nested filter for arrays (e.g. versions.*, databases.*)
      if (key.includes('.')) {
        const [arrayProp, ...rest] = key.split('.');
        const nestedKey = rest.join('.');
        const nestedArr = item[arrayProp];
        if (!Array.isArray(nestedArr)) return false;
        // Filter on array length
        if (nestedKey === '' || nestedKey === 'length') {
          const count = nestedArr.length;
          if (val.startsWith('>=')) return count >= Number(val.substring(2));
          if (val.startsWith('<=')) return count <= Number(val.substring(2));
          if (val.startsWith('>')) return count > Number(val.substring(1));
          if (val.startsWith('<')) return count < Number(val.substring(1));
          if (val.startsWith('=')) return count === Number(val.substring(1));
          return count === Number(val);
        }
        // Otherwise, filter on a property of at least one nested object
        return nestedArr.some((nested: any) => {
          if (val.startsWith('!')) return String(nested[nestedKey]) !== val.substring(1);
          if (val.startsWith('>=')) return nested[nestedKey] >= val.substring(2);
          if (val.startsWith('<=')) return nested[nestedKey] <= val.substring(2);
          if (val.startsWith('>')) return nested[nestedKey] > val.substring(1);
          if (val.startsWith('<')) return nested[nestedKey] < val.substring(1);
          if (val.startsWith('*') && val.endsWith('*')) {
            const search = val.slice(1, -1).toLowerCase();
            return String(nested[nestedKey]).toLowerCase().includes(search);
          }
          return String(nested[nestedKey]) === val;
        });
      } else {
        // Support filtering on array length with just the array property name (e.g. databases, versions)
        if (Array.isArray(item[key])) {
          const count = item[key].length;
          if (val.startsWith('>=')) return count >= Number(val.substring(2));
          if (val.startsWith('<=')) return count <= Number(val.substring(2));
          if (val.startsWith('>')) return count > Number(val.substring(1));
          if (val.startsWith('<')) return count < Number(val.substring(1));
          if (val.startsWith('=')) return count === Number(val.substring(1));
          return count === Number(val);
        }
        // Standard property
        const itemVal = item[key];
        if (val.startsWith('!')) return String(itemVal) !== val.substring(1);
        if (val.startsWith('>=')) return itemVal >= val.substring(2);
        if (val.startsWith('<=')) return itemVal <= val.substring(2);
        if (val.startsWith('>')) return itemVal > val.substring(1);
        if (val.startsWith('<')) return itemVal < val.substring(1);
        if (val.startsWith('*') && val.endsWith('*')) {
          const search = val.slice(1, -1).toLowerCase();
          return String(itemVal).toLowerCase().includes(search);
        }
        return String(itemVal) === val;
      }
    })
  );
}