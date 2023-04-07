import { IPresentation } from "../../../models/mongodb/presentation";
import { IPresentationCombination } from "../../../models/mongodb/presentation/combination";
import { IPresentationDisplay } from "../../../models/mongodb/presentation/display";
import { IPresentationSlide } from "../../../models/mongodb/presentation/slide";
import { IPresentationElement } from "../../../models/mongodb/presentation/element";

export const display1 = {
  "token": "5ac46dfaa526ca0028f7c000",
  "width": 640,
  "height": 480,
  "name": "Display 1",
  "x": 0,
  "y": 0,
  "rotate": 0,
  "scale": 1,
} as IPresentationDisplay;

export const display2 = {
  "token": "5ac46dfaa526ca0028f7c111",
  "width": 640,
  "height": 480,
  "name": "Display 2",
  "x": 640,
  "y": 0,
  "rotate": 0,
  "scale": 1,
} as IPresentationDisplay;

export const presentation1 = {
  "title": "Test Presentation",
  "render": true,
  "schedule": {
    "start": "* * * * *",
    "end": "* * * * *",
  },
  "canvas": {
    "orientation": "portrait",
    "width": 1,
    "height": 1,
    "display_width": 1920,
    "display_height": 1080,
  },
  "displays" : [display1],
  "slides": [{
    "token": "5ac46dfaa526ca0028f7c111",
    "delay": 30,
    "elements": [{
      "token": "5ac46dfaa526ca0028f7c222",
      "type": "media",
      "layout": {
        "left": 0,
        "right": 0,
        "top": 0,
        "bottom": 50,
      },
      "media": {
        "mime": "image/png",
        "token": "d3116aff-79ce-44ff-b952-c37fa3f2e027",
      },
      "schedule": {
        "start": "1 0 * * *",
        "end": "2 0 * * *",
      },
    } as IPresentationElement],
  } as IPresentationSlide],
} as IPresentation;

export const presentation2 = {
  "title": "Test Presentation 2",
  "render": true,
  "canvas": {
    "orientation": "portrait",
    "width": 3,
    "height": 1,
    "display_width": 1920,
    "display_height": 1080,
    "ratio": 1,
  },
} as IPresentation;

export const presentation2_nulls = {
  "title": "Test Presentation 2",
  "render": true,
  "canvas": {
    "orientation": "portrait",
    "width": 3,
    "height": 1,
    "display_width": 1920,
    "display_height": 1080,
    "ratio": null,
  },
} as IPresentation;
