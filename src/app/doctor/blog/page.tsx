// Same content as /blog, rendered at a /doctor-prefixed URL for the staff
// nav tab. Deliberately NOT passing a custom basePath -- individual post,
// write, and edit links inside BlogListContent still resolve to their
// existing working /blog/... routes rather than requiring a full parallel
// mirror of the authoring/editing flow under /doctor/blog/....
export { default, metadata } from "@/app/blog/page";
