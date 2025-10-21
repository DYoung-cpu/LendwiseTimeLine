/**
 * Milestone Data Schema
 * Provides structure, validation, and type safety for milestone data
 */

export class Milestone {
    constructor({
        id,
        title,
        date,
        category,
        icon,
        description,
        impact,
        metrics = [],
        status = 'completed',
        team = null,
        challenges = null,
        outcome = null,
        // Custom fields for specific milestones
        address = null,
        images = [],
        details = null,
        whyThisLocation = [],
        amenities = [],
        spaces = [],
        customFields = {}
    }) {
        // Required fields
        this.id = id;
        this.title = title;
        this.date = date;
        this.category = category;
        this.icon = icon;
        this.description = description;
        this.impact = impact;
        this.metrics = Array.isArray(metrics) ? metrics : [];

        // Optional standard fields
        this.status = status;
        this.team = team;
        this.challenges = challenges;
        this.outcome = outcome;

        // Location-specific fields
        this.address = address;
        this.images = Array.isArray(images) ? images : [];
        this.details = details;
        this.whyThisLocation = Array.isArray(whyThisLocation) ? whyThisLocation : [];
        this.amenities = Array.isArray(amenities) ? amenities : [];
        this.spaces = Array.isArray(spaces) ? spaces : [];

        // Extension point for future custom fields
        this.customFields = customFields;

        // Validate after construction
        this.validate();
    }

    /**
     * Validate required fields and data types
     * Throws error if validation fails
     */
    validate() {
        const requiredFields = {
            id: 'string',
            title: 'string',
            date: 'string',
            category: 'string',
            icon: 'string',
            description: 'string',
            impact: 'string'
        };

        for (const [field, expectedType] of Object.entries(requiredFields)) {
            if (!this[field]) {
                throw new Error(`Milestone validation failed: Missing required field "${field}" for milestone "${this.id || 'unknown'}"`);
            }

            if (typeof this[field] !== expectedType) {
                throw new Error(`Milestone validation failed: Field "${field}" must be ${expectedType}, got ${typeof this[field]} for milestone "${this.id}"`);
            }
        }

        // Validate arrays
        if (!Array.isArray(this.metrics)) {
            throw new Error(`Milestone validation failed: metrics must be an array for milestone "${this.id}"`);
        }

        return true;
    }

    /**
     * Check if milestone is in progress
     */
    isInProgress() {
        return this.status === 'In Progress' || this.status === 'in-progress';
    }

    /**
     * Check if milestone is completed
     */
    isCompleted() {
        return this.status === 'completed' || this.status === 'Completed';
    }

    /**
     * Check if milestone is planned
     */
    isPlanned() {
        return this.status === 'Planned' || this.status === 'planned';
    }

    /**
     * Get formatted date (can be extended for date parsing)
     */
    getFormattedDate() {
        return this.date;
    }

    /**
     * Check if milestone has images
     */
    hasImages() {
        return this.images && this.images.length > 0;
    }

    /**
     * Get metric count
     */
    getMetricCount() {
        return this.metrics.length;
    }

    /**
     * Convert to plain object (for JSON serialization)
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            date: this.date,
            category: this.category,
            icon: this.icon,
            description: this.description,
            impact: this.impact,
            metrics: this.metrics,
            status: this.status,
            ...(this.team && { team: this.team }),
            ...(this.challenges && { challenges: this.challenges }),
            ...(this.outcome && { outcome: this.outcome }),
            ...(this.address && { address: this.address }),
            ...(this.images.length > 0 && { images: this.images }),
            ...(this.details && { details: this.details }),
            ...(this.whyThisLocation.length > 0 && { whyThisLocation: this.whyThisLocation }),
            ...(this.amenities.length > 0 && { amenities: this.amenities }),
            ...(this.spaces.length > 0 && { spaces: this.spaces }),
            ...(Object.keys(this.customFields).length > 0 && { customFields: this.customFields })
        };
    }

    /**
     * Create a shallow clone
     */
    clone() {
        return new Milestone(this.toJSON());
    }
}

/**
 * Factory function to create milestones with error handling
 */
export function createMilestone(data) {
    try {
        return new Milestone(data);
    } catch (error) {
        console.error('Error creating milestone:', error.message);
        console.error('Milestone data:', data);
        throw error;
    }
}
