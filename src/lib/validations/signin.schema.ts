/**
 * Sign In Validation Schema
 *
 * Yup schema for sign in form validation.
 */

import * as yup from 'yup';

export const signInSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type SignInFormData = yup.InferType<typeof signInSchema>;

