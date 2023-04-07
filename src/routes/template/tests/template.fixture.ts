import { IPresentationSlide } from "../../../models/mongodb/presentation/slide";
import { IPresentationElement } from "../../../models/mongodb/presentation/element";
import { ITemplate } from "../../../models/mongodb/template";
import { ITemplateData } from "../../../models/mongodb/templatedata";

export const template1 = {
  "title": "Test Template",
  "canvas": {
    "orientation": "portrait",
    "width": 1,
    "height": 1,
    "display_width": 1920,
    "display_height": 1080,
  },
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
      "bindings": [{
        "token": "5d3804e48887250021b71ca6",
        "path": "sources[0].items[token=5d0a4ed7bc75c6da0702cf57].value_media",
        "type": "template",
        "target": "media",
        "feed": "5d0a4ed7bc75c6da0702cf57",
      }],
    } as IPresentationElement],
  } as IPresentationSlide],
  "template_data": {
    "sources": [{
      "slide": "5ac46dfaa526ca0028f7c111",
      "items": [{
        "token": "5d0a4ed7bc75c6da0702cf57",
        "description": "Template item",
        "type": "media",
        "default_media": {
          "mime": "image/png",
          "token": "d3116aff-79ce-44ff-b952-c37fa3f2e027",
        },
        "value_media": {
          "mime": "image/png",
          "token": "d3116aff-79ce-44ff-b952-c37fa3f2e027",
        },
        "hints_media" : [
          {
            "mime" : "image/png",
            "token" : "d3b885f0-045c-4b6a-a4a3-0a6626a115ca",
          },
          {
            "mime" : "image/png",
            "token" : "d654d032-b4c6-488e-905e-78284fc4c9f5",
          },
        ],
      }],
    }],
  } as ITemplateData,
} as ITemplate;

export const template1Patch = {
  "title": "Test Template 2",
};
