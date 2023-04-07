import config from "../../config";

import {
  PurchaseTemplate,
  PurchaseTemplateCreate,
} from "../../domain/purchase";
import {
  MediaRecordingRequest,
  MediaRecordingPresentation,
} from "../../domain/recording";
import { IUser } from "../../domain/user";

import { IPresentation } from "../mongodb/presentation";
import { EPresentationBindingType } from "../mongodb/presentation/binding";
import { ITemplate } from "../mongodb/template";
import { generateObjectId } from "../mongodb/schema";
import { ITemplateSlide } from "../mongodb/template/slide";
import { IPresentationSlide } from "../mongodb/presentation/slide";

import backend from "../../services/backend";
import logger from "../../services/logger";

import model from "../";

import { RuntimeDeploymentCreate } from "@triggerpointmedia/dts-server-client";
import * as md5 from "md5";
import * as moment from "moment";
import * as uuid from "uuid";

export const preparePresentationPreview = (entity: IPresentation): string => {
  if (config.is_testing) {
    return null;
  }

  if (!entity.slides) {
    return null;
  }

  const [slide] = entity.slides?.filter((x) => !x.hidden);

  if (!slide) {
    return null;
  }

  const elements = slide.elements?.filter((x) => !x.hidden).length;

  if (elements === 0) {
    return null;
  }

  const preview = generatePreviewId(entity);

  if (preview === entity.preview) {
    return null;
  }

  return preview;
};

export const generatePresentationPreview = async (
  entity: IPresentation
): Promise<void> => {
  try {
    const { canvas, preview } = entity;

    const [slide] = entity.slides?.filter((x) => !x.hidden);

    if (!slide || !preview) {
      return;
    }

    const width = Math.round(
      (canvas.width || 1) *
        (!canvas.orientation || canvas.orientation === "landscape"
          ? canvas.display_width || 1920
          : canvas.display_height || 1080)
    );
    const height = Math.round(
      (canvas.height || 1) *
        (!canvas.orientation || canvas.orientation === "landscape"
          ? canvas.display_height || 1080
          : canvas.display_width || 1920)
    );

    const response = await backend.api.renderPresentation({
      body: {
        width,
        height,
        id: preview,
        location: entity.location,
        presentation: entity.token,
        slide: slide.token,
        type: "presentation",
      },
    });

    if (response.status !== "ready" && response.status !== "processing") {
      logger.warn({ response }, "Failure renderer response.");
    }
  } catch (error) {
    logger.warn({ error }, "Presentation preview render error.");
  }
};

export const prepareTemplatePreview = (entity: ITemplate): string | null => {
  logger.debug({}, "Template preview generate requested.");

  if (config.is_testing) {
    return null;
  }

  if (!entity.slides) {
    return null;
  }

  const [slide] = entity.slides?.filter((x) => !x.hidden);

  if (!slide) {
    return null;
  }

  const elements = slide.elements?.filter((x) => !x.hidden).length;

  if (elements === 0) {
    return null;
  }

  const preview = generatePreviewId(entity);

  if (preview === entity.preview) {
    return null;
  }

  return preview;
};

export const generateTemplatePreview = async (
  entity: ITemplate
): Promise<void> => {
  try {
    const { canvas, preview } = entity;

    const [slide] = entity.slides?.filter((x) => !x.hidden);

    if (!slide || !preview) {
      return;
    }

    const width = Math.round(
      (canvas.width || 1) *
        (!canvas.orientation || canvas.orientation === "landscape"
          ? canvas.display_width || 1920
          : canvas.display_height || 1080)
    );
    const height = Math.round(
      (canvas.height || 1) *
        (!canvas.orientation || canvas.orientation === "landscape"
          ? canvas.display_height || 1080
          : canvas.display_width || 1920)
    );

    const response = await backend.api.renderPresentation({
      body: {
        width,
        height,
        id: preview,
        location: entity.location,
        presentation: entity.token,
        slide: slide.token,
        type: "template",
      },
    });

    if (response.status !== "ready" && response.status !== "processing") {
      logger.warn({ response }, "Failure renderer response.");
    }
  } catch (error) {
    logger.warn({ error }, "Template preview render error.");
  }
};

export const listTemplatePurchase = async (
  location: string
): Promise<PurchaseTemplate[]> => {
  if (config.is_testing) {
    return [];
  }

  return await backend.api.listTemplatePurchase({ location });
};

export const purchaseTemplate = async (
  template: ITemplate,
  user: IUser
): Promise<PurchaseTemplate> => {
  if (config.is_testing) {
    return {
      token: uuid.v4(),
      created: moment().format(),
      location: user.business,
      template: template.token,
      price: template.price,
      user: user.user,
    };
  }

  let business = user.business;

  if (!business) {
    const location = await backend.api.readLocation({ id: user.location });

    switch (location.type) {
      case "facility":
        business = location.parent?.token;
        break;
      case "business":
        business = location.token;
        break;
      default:
        throw new Error("Invalid location.");
    }
  }

  const request: PurchaseTemplateCreate = {
    location: business,
    template: template.token,
    price: template.price,
    user: user.user,
  };

  return await backend.api.createTemplatePurchase({ body: request });
};

export const handlePresentationRecordings = async (
  entity: IPresentation
): Promise<void> => {
  if (config.is_testing) {
    return;
  }

  if (
    !entity.render ||
    !entity.displays ||
    entity.displays.length === 0 ||
    entity.slides.length === 0 ||
    !entity.canvas.output_width ||
    !entity.canvas.output_height
  ) {
    return;
  }

  const deployment = uuid.v4();

  const campaign: MediaRecordingPresentation = {
    token: entity.token,
    slides: (entity.slides || [])
      .filter(
        (slide) =>
          !slide.hidden &&
          slide.elements &&
          slide.elements.filter((e) => !e.hidden).length > 0
      )
      .map((slide) => ({
        token: slide.token,
        duration: slide.delay || 0,
        combinations: (slide.combinations || []).map((combination) => ({
          token: combination.token,
          combinations: combination.combinations,
          display: combination.display,
        })),
      })),
    displays: (entity.displays || []).map((display) => ({
      token: display.token,
      width: display.video_width || display.width,
      height: display.video_height || display.height,
      x: display.x || 0,
      y: display.y || 0,
      scale: display.scale || 1,
      rotate: display.rotate || 0,
    })),
    canvas: {
      output_width: entity.canvas.output_width,
      output_height: entity.canvas.output_height,
      width: entity.canvas.width,
      height: entity.canvas.height,
      display_width: entity.canvas.display_width,
      display_height: entity.canvas.display_height,
      orientation: entity.canvas.orientation,
    },
  };

  const recordingRequest: MediaRecordingRequest = {
    deployment,
    location: entity.location,
    preview: true,
    presentations: [campaign].filter((x) => x.slides.length > 0),
  };

  if (recordingRequest.presentations.length === 0) {
    return;
  }

  const recordingResponse = await backend.api.createRecordingForDeployment({
    body: recordingRequest,
  });

  if (recordingResponse.created.length > 0) {
    logger.debug(
      {
        request: recordingRequest,
        response: recordingResponse,
      },
      "Recordings received."
    );

    const deploymentRequest: RuntimeDeploymentCreate = {
      hidden: true,
      location: entity.location,
      digest: {
        // theme_mode: DeploymentThemeMode.Parent,
        presentation_mode: "devices",
        presentations: [entity.token],
      },
    };

    const newDeployment = await backend.api.createDeployment({
      body: deploymentRequest,
    });

    logger.debug(
      {
        request: recordingRequest,
        deployment: newDeployment,
      },
      "New deployment created."
    );
  }
};

export const generateTemplatePresentation = (
  source: ITemplate,
  slide?: string
): IPresentation => {
  const template: ITemplate = source.toJSON() as any;

  if (!template.template_data || !template.template_data.sources) {
    throw new Error("Invalid template_data.");
  }

  const presentation = {
    token: uuid.v4(),
    created: template.created,
    modified: new Date(),
    title: template.title,
    slides: template.slides,
    canvas: template.canvas,
    template_data: template.template_data,
    assets: template.assets,
    databases: template.databases,
    bitmaps: template.bitmaps,
    render: template.render,
  } as IPresentation;

  if (slide) {
    presentation.slides = presentation.slides?.filter((x) => x.token === slide);

    if (presentation.slides.length === 0) {
      throw new Error("Slide not found.");
    }

    presentation.template_data.sources =
      presentation.template_data.sources?.filter((s) => {
        return !s.slide || s.slide === slide;
      });
  }

  if (presentation.slides.length !== 1) {
    throw new Error("Invalid slides.");
  }

  // if (!presentation.template_data.sources || presentation.template_data.sources.length === 0) {
  //   throw new Error('Invalid template_data.');
  // }

  const slidesMap: { [x: string]: string } = {};

  presentation.slides.forEach((slide) => {
    const token = (slide.source_slide = slide.token);
    slide.token = slidesMap[token] = generateObjectId();
    slide.source_presentation = template.token;
    slide.combinations = null;
    slide.modified = new Date();
  });

  let mainSourceId: string;
  const sourcesMap: { [x: string]: string } = {};
  const sourceItemsMap: { [x: string]: string } = {};

  presentation.template_data.sources?.forEach((source) => {
    if (source.slide) {
      const token = source.slide;
      source.slide = slidesMap[token];
    }

    const token = source.token;
    source.token = sourcesMap[token] = generateObjectId();

    if (!mainSourceId) {
      mainSourceId = source.token;
    }

    source.items?.forEach((item) => {
      const token = item.token;
      item.token = sourceItemsMap[token] =
        sourceItemsMap[token] || generateObjectId();
    });
  });

  presentation.slides.forEach((slide) => {
    slide.elements?.forEach((element) => {
      element.bindings?.forEach((binding) => {
        binding.token = generateObjectId();

        if (binding.type === EPresentationBindingType.Template) {
          if (binding.path) {
            Object.keys(sourcesMap).forEach((token) => {
              binding.path = binding.path.replace(token, sourcesMap[token]);
            });

            Object.keys(sourceItemsMap).forEach((token) => {
              binding.path = binding.path.replace(token, sourceItemsMap[token]);
            });

            Object.keys(slidesMap).forEach((token) => {
              binding.path = binding.path.replace(token, slidesMap[token]);
            });

            if (mainSourceId) {
              binding.path = binding.path.replace(
                /sources\[0\]/,
                `sources[token=${mainSourceId}]`
              );
            }
          }

          if (binding.feed) {
            binding.feed = sourceItemsMap[binding.feed];
          }
        }
      });
    });
  });

  return new model.db.Presentation(presentation);
};

export const prepareInputPayload = (
  entity: IPresentation | ITemplate
): void => {
  const processObj = (obj: any) => {
    Object.keys(obj).forEach((key) => {
      if (key.includes("_")) {
        const newKey = key.replace(/_/g, "-");

        obj[newKey] = obj[key];
        delete obj[key];
      }
    });
  };

  entity.slides?.forEach((slide: IPresentationSlide | ITemplateSlide) => {
    slide.elements?.forEach((element) => {
      if (element.style) {
        processObj(element.style);
      }

      if (element.clock?.style) {
        processObj(element.clock?.style);
      }

      if (element.social) {
        if (element.social.body) {
          processObj(element.social.body);
        }

        if (element.social.header) {
          processObj(element.social.header);
        }
      }

      if (element.container) {
        if (element.container.delays) {
          element.container.delays = element.container.delays.map((x) => {
            switch (true) {
              case x > 0:
                return x;
              default:
                return null;
            }
          });
        }
      }
    });
  });

  entity.assets?.forEach((asset) => {
    if (asset.meta) {
      processObj(asset.meta);
    }
  });

  if (entity.canvas && entity.canvas["background_color"]) {
    entity.canvas["background-color"] = entity.canvas["background_color"];
    delete entity.canvas["background_color"];
  }
};

function generatePreviewId(entity: IPresentation | ITemplate): string {
  const base =
    `${entity.canvas?.modified?.toString()}` +
    `${
      entity.slides && entity.slides.length > 0
        ? entity.slides[0].modified?.toString()
        : ""
    }`;

  return md5(base);
}
