const Joi = require('joi');

// Validation schemas
const schemas = {
  // Fraud evaluation payload
  evaluateRisk: Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
    currency: Joi.string().length(3).uppercase().required().messages({
      'string.base': 'Currency must be a string',
      'string.length': 'Currency must be 3 characters (e.g., USD)',
      'any.required': 'Currency is required'
    }),
    ip: Joi.string().ip().required().messages({
      'string.ip': 'IP must be a valid IP address',
      'any.required': 'IP is required'
    }),
    deviceFingerprint: Joi.string().min(1).required().messages({
      'string.empty': 'Device fingerprint cannot be empty',
      'any.required': 'Device fingerprint is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    })
  }),

  // Tenant creation payload
  createTenant: Joi.object({
    tenantId: Joi.string().alphanum().min(3).max(50).required().messages({
      'string.alphanum': 'Tenant ID must contain only alphanumeric characters',
      'string.min': 'Tenant ID must be at least 3 characters',
      'string.max': 'Tenant ID must be at most 50 characters',
      'any.required': 'Tenant ID is required'
    }),
    stripeKey: Joi.string().min(10).required().messages({
      'string.min': 'Stripe key must be at least 10 characters',
      'any.required': 'Stripe key is required'
    }),
    preferredProcessor: Joi.string().valid('stripe', 'paypal').required().messages({
      'any.only': 'Preferred processor must be either "stripe" or "paypal"',
      'any.required': 'Preferred processor is required'
    })
  }),

  // Tenant payment payload
  tenantPayment: Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
    currency: Joi.string().length(3).uppercase().required().messages({
      'string.base': 'Currency must be a string',
      'string.length': 'Currency must be 3 characters (e.g., USD)',
      'any.required': 'Currency is required'
    }),
    source: Joi.string().min(1).required().messages({
      'string.empty': 'Payment source cannot be empty',
      'any.required': 'Payment source is required'
    })
  }),

  // Circuit breaker payment payload
  circuitPayment: Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
    currency: Joi.string().length(3).uppercase().required().messages({
      'string.base': 'Currency must be a string',
      'string.length': 'Currency must be 3 characters (e.g., USD)',
      'any.required': 'Currency is required'
    }),
    source: Joi.string().min(1).required().messages({
      'string.empty': 'Payment source cannot be empty',
      'any.required': 'Payment source is required'
    })
  }),

  // Tenant ID parameter
  tenantId: Joi.object({
    tenantId: Joi.string().alphanum().min(3).max(50).required().messages({
      'string.alphanum': 'Tenant ID must contain only alphanumeric characters',
      'string.min': 'Tenant ID must be at least 3 characters',
      'string.max': 'Tenant ID must be at most 50 characters',
      'any.required': 'Tenant ID is required'
    })
  })
};

// Validation middleware factory
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(500).json({ error: 'Validation schema not found' });
    }

    const dataToValidate = schemaName === 'tenantId' ? req.params : req.body;
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Replace the validated data
    if (schemaName === 'tenantId') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
}

module.exports = {
  validate,
  schemas
}; 