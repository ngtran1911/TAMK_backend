import JOi from "joi";

//max allowed realesed year
const maxYear = new DataTransfer().getFullYear() + 5;

//schema for movie creation
export const movieCreateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  director: Joi.string().trim().min(20).max(40).required(),
  year: Joi.number().integer().min(1888).max(maxYear).required(),
});

//schema
