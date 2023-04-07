export interface IAnalyticsEvent {
  callback:string;
  task:IAnalyticsTask;
}

export interface IAnalyticsTask {
  time:string;
  execution:string;
}

export interface IAnalyticsMenuItem {
  id:string;
  business:string;
  location:string;
  menu:string;
  category?:string;
  menuitem:string;
  created:number;
  title:string;
  description?:string;
  order:string;
  price:number;
  category_title?:string;
  category_subtitle?:string;
  menu_title:string;
  source_menu?:string;
  source_item?:string;
}

export interface IAnalyticsMenuItemModifier {
  id:string;
  modifier:string;
  modifieritem:string;
  menuitem:string;
  order:string;
  price:number;
  modifier_title:string;
  modifieritem_title:string;
}

export interface IAnalyticsMenuItemAllergen {
  id:string;
  allergen:string;
  menuitem:string;
  title:string;
}

export interface IAnalyticsMenuItemIngredient {
  id:string;
  ingredient:string;
  menuitem:string;
  modifieritem?:string;
  amount:number;
  title:string;
}
