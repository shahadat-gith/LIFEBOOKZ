import { categories, getDocsByCategory } from './docs';

export const sidebarGroups = categories.map((category) => ({
  ...category,
  items: getDocsByCategory(category.id).map((doc) => ({
    id: doc.id,
    title: doc.title,
    route: doc.route,
    icon: doc.icon,
  })),
}));

export const getSidebarGroups = () => sidebarGroups;

export default sidebarGroups;
