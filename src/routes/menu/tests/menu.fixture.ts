import { IMenu } from "../../../models/mongodb/menu";
import { IMenuItem } from "../../../models/mongodb/menu/item";
import { IMenuCategory } from "../../../models/mongodb/menu/category";

export const menu = {
  "title": "Test Menu",
  "type": "orderable",
  "categories": [
    {
      "token": "56e5de1404a57b12006b14bb",
      "title": "Some category",
    },
    {
      "token": "67e5de1404a57b12006b14bb",
      "title": "Some other category",
    },
  ],
  "items": [
    {
      "token": "56e5de1404a57b12006b14aa",
      "title": "Some item",
      "order": {
        "token": "847429c4-bb61-40b5-b3fa-a4a50151030c",
        "price": 0,
      },
    } as any,
    {
      "token": "56e5de1404a57b12006b14ab",
      "title": "Some other item",
      "order": {
        "token": "777429c4-bb61-40b5-b3fa-a4a50151030c",
        "price": 1,
      },
    } as any,
  ],
  "schedule": {
    "start": "* * * * *",
    "end": "* * * * *",
  },
} as IMenu;

export const menuitem = {
  "token": "56e5de1404a57b12006b14aa",
  "title": "Some item",
  "order": {
    "token": "000429c4-bb61-40b5-b3fa-a4a50151030c",
    "price": 0,
  },
} as any as IMenuItem;

export const menucategory = {
  "token": "56e5de1404a57b12006b14bb",
  "title": "Some category",
} as any as IMenuCategory;

export default menu;
