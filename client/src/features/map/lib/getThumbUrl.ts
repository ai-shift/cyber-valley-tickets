import type { Placemark } from "@/entities/geodata";
import { swapBR } from "./colorTruncator.ts";

const BASE_ICON_URL = "https://mt.googleapis.com/vt/icon/name=icons/onion/";

export const getThumbUrl = (mark: Placemark) => {
  switch (mark.type) {
    case "point":
      return mark.iconUrl;
    case "polygon":
      return `${BASE_ICON_URL}1492-wht-polygon-blank.png&filter=${swapBR(mark.line_color)}`;
    case "line":
      return `${BASE_ICON_URL}1491-wht-line-blank.png&filter=${swapBR(mark.line_color)}`;
  }
};
