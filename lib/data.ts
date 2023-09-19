type Draw =
  | {
      command: "h";
      parameterList: [number];
    }
  | {
      command: "v";
      parameterList: [number];
    }
  | {
      command: "l";
      parameterList: [number, number];
    }
  | {
      command: "c";
      parameterList: [number, number, number, number, number, number];
    };

type Point = [number, number];

type LinearCurve = {
  type: "linear";
  controls: [Point, Point];
};

type CubicCurve = {
  type: "cubic";
  controls: [Point, Point, Point, Point];
};

type Curve = LinearCurve | CubicCurve;

interface Stroke {
  feature: string;
  start: Point;
  curveList: Draw[];
}

interface RenderedStroke {
  feature: string;
  curveList: Curve[];
}

type Glyph = Stroke[];
type RenderedGlyph = RenderedStroke[];

interface Component {
  shape: {
    glyph: Glyph;
    reference: string;
  }[];
}

interface Character {
  shape: Component[];
}

interface Database {
  [key: string]: Component;
}

export type { Point, Draw, Stroke, Glyph, Component, Character, Database };
export type { LinearCurve, CubicCurve, Curve, RenderedStroke, RenderedGlyph };
