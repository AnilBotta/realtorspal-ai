/**
 * Utility functions for lead nurturing display and formatting
 */

/**
 * Format next action time to local time
 */
export function formatNextActionTime(isoTimestamp) {
  if (!isoTimestamp) return '';
  
  try {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // If in the past
    if (diffMs < 0) {
      return 'Overdue';
    }
    
    // If less than 1 hour away
    if (diffHours === 0) {
      if (diffMins < 1) {
        return 'Now';
      }
      return `in ${diffMins}m`;
    }
    
    // If today
    if (diffHours < 24) {
      return `in ${diffHours}h ${diffMins}m`;
    }
    
    // Otherwise show date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return '';
  }
}

/**
 * Get status badge text for nurturing status
 */
export function getNurturingStatusBadge(lead) {
  if (!lead) return null;
  
  const status = lead.nurturing_status;
  const currentStep = lead.nurturing_current_step || 0;
  const totalSteps = lead.nurturing_total_steps || 0;
  const nextAction = lead.nurturing_next_action_at;
  
  // Only show badge if nurturing is active
  if (!['active', 'running', 'paused', 'snoozed'].includes(status)) {
    return null;
  }
  
  let statusText = '';
  let statusColor = '';
  
  if (status === 'active' || status === 'running') {
    statusText = 'Nurturing in progress';
    statusColor = 'green';
  } else if (status === 'paused') {
    statusText = 'Paused';
    statusColor = 'yellow';
  } else if (status === 'snoozed') {
    statusText = 'Snoozed';
    statusColor = 'blue';
  }
  
  const stepInfo = totalSteps > 0 ? ` • Step ${currentStep + 1}/${totalSteps}` : '';
  const timeInfo = nextAction ? ` • Next ${formatNextActionTime(nextAction)}` : '';
  
  return {
    text: `🤖 ${statusText}${stepInfo}${timeInfo}`,
    color: statusColor,
    status: status
  };
}

/**
 * Get color classes for status badge
 */
export function getStatusColorClass(color) {
  const colorMap = {
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colorMap[color] || colorMap.gray;
}
