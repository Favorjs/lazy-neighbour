/**
 * Errand State Machine
 * Enforces valid status transitions for errands
 */

const VALID_TRANSITIONS = {
    PENDING: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['COMPLETED', 'DISPUTED'],
    COMPLETED: ['RELEASED', 'DISPUTED'],
    RELEASED: [], // Terminal state
    DISPUTED: ['RELEASED', 'CANCELLED'], // Admin resolves
    CANCELLED: [] // Terminal state
};

const TRANSITION_ACTIONS = {
    'PENDING->ACTIVE': 'Runner accepted the errand',
    'PENDING->CANCELLED': 'Requester cancelled the errand',
    'ACTIVE->COMPLETED': 'Runner marked errand as complete',
    'ACTIVE->DISPUTED': 'Errand was disputed',
    'COMPLETED->RELEASED': 'Payment released to runner',
    'COMPLETED->DISPUTED': 'Errand was disputed after completion',
    'DISPUTED->RELEASED': 'Dispute resolved - paid runner',
    'DISPUTED->CANCELLED': 'Dispute resolved - refunded requester'
};

/**
 * Check if a status transition is valid
 */
const isValidTransition = (currentStatus, newStatus) => {
    const validNextStates = VALID_TRANSITIONS[currentStatus] || [];
    return validNextStates.includes(newStatus);
};

/**
 * Get action description for a transition
 */
const getTransitionAction = (fromStatus, toStatus) => {
    const key = `${fromStatus}->${toStatus}`;
    return TRANSITION_ACTIONS[key] || 'Status updated';
};

/**
 * Get all valid next states for current status
 */
const getValidNextStates = (currentStatus) => {
    return VALID_TRANSITIONS[currentStatus] || [];
};

/**
 * Check if user can perform transition
 */
const canUserTransition = (user, errand, newStatus) => {
    const { status: currentStatus, requesterId, runnerId } = errand;
    const userId = user.id;

    // Check if transition is valid first
    if (!isValidTransition(currentStatus, newStatus)) {
        return {
            allowed: false,
            reason: `Cannot transition from ${currentStatus} to ${newStatus}`
        };
    }

    // Role-based permissions
    switch (`${currentStatus}->${newStatus}`) {
        case 'PENDING->ACTIVE':
            // Only a different user (runner) can accept
            if (userId === requesterId) {
                return { allowed: false, reason: 'Cannot accept your own errand' };
            }
            return { allowed: true };

        case 'PENDING->CANCELLED':
            // Only requester can cancel
            if (userId !== requesterId) {
                return { allowed: false, reason: 'Only the requester can cancel' };
            }
            return { allowed: true };

        case 'ACTIVE->COMPLETED':
            // Only runner can mark complete
            if (userId !== runnerId) {
                return { allowed: false, reason: 'Only the runner can mark as complete' };
            }
            return { allowed: true };

        case 'ACTIVE->DISPUTED':
        case 'COMPLETED->DISPUTED':
            // Either party can dispute
            if (userId !== requesterId && userId !== runnerId) {
                return { allowed: false, reason: 'Only participants can dispute' };
            }
            return { allowed: true };

        case 'COMPLETED->RELEASED':
            // Only requester can release funds
            if (userId !== requesterId) {
                return { allowed: false, reason: 'Only the requester can release funds' };
            }
            return { allowed: true };

        case 'DISPUTED->RELEASED':
        case 'DISPUTED->CANCELLED':
            // Only admin can resolve disputes (TODO: add admin check)
            return { allowed: true };

        default:
            return { allowed: false, reason: 'Unknown transition' };
    }
};

module.exports = {
    isValidTransition,
    getTransitionAction,
    getValidNextStates,
    canUserTransition,
    VALID_TRANSITIONS
};
