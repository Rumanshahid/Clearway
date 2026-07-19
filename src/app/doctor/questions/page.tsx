// Same content as /questions, rendered at a /doctor-prefixed URL for the
// staff nav tab. Deliberately NOT passing a custom basePath -- individual
// question, ask, and edit links inside QuestionsListContent still resolve
// to their existing working /questions/... routes rather than requiring a
// full parallel mirror of that flow under /doctor/questions/....
export { default, metadata } from "@/app/questions/page";
