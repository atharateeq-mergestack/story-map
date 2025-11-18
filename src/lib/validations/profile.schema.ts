import * as yup from 'yup';

export const profileSchema = yup.object({
  fullName: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must be less than 255 characters')
    .notRequired(),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

export type ProfileFormData = yup.InferType<typeof profileSchema>;
