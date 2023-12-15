import type { Dispatch } from "react";
import { createContext, useContext } from "react";
import type { Config, SieveName } from "~/lib/config";
import type { Glyph, Character } from "~/lib/data";
import { useLocation } from "react-router-dom";
import { Feature } from "~/lib/classifier";

// Config 对象一共有 7 个字段，除了 version 和 source 不可变外，均可以通过 action 改变
// LoadAction 可以直接替换 Config 本身
// InfoAction 对应 info 字段
// DataAction 对应 data 字段
// ElementAction 对应 form 和 pronunciation 字段
// EncoderAction 对应 encoder 字段

export type Action =
  | LoadAction
  | InfoAction
  | DataAction
  | ElementAction
  | EncoderAction;

interface LoadAction {
  type: "load";
  value: Config;
}
interface InfoAction {
  type: "info";
  value: Config["info"];
}
type DataAction = {
  type: "data";
  action: "add" | "remove";
} & (
  | { subtype: "form"; key: string; value?: Glyph }
  | { subtype: "repertoire"; key: string; value?: Character }
  | { subtype: "classifier"; key: string; value?: number }
);
type ElementAction = {
  type: "element";
  index: "form" | "pronunciation";
} & ElementSubAction;
interface EncoderAction {
  type: "encoder";
  value: Config["encoder"];
}

type ElementSubAction =
  | {
      subtype: "generic-alphabet";
      value: string;
    }
  | {
      subtype: "generic-maxcodelen";
      value: number;
    }
  | {
      subtype: "generic-mapping";
      action: "add" | "remove";
      key: string;
      value?: string;
    }
  | {
      subtype: "generic-grouping";
      action: "add" | "remove";
      key: string;
      value?: string;
    }
  | {
      subtype: "root-degenerator";
      action: "add" | "remove";
      key: Feature;
      value?: Feature;
    }
  | {
      subtype: "root-degenerator-nocross";
      action: "toggle";
    }
  | {
      subtype: "root-selector";
      action: "add" | "remove";
      value: SieveName;
    }
  | {
      subtype: "root-selector";
      action: "replace";
      value: SieveName[];
    }
  | {
      subtype: "root-selector-strongweak";
      variant: "strong" | "weak";
      action: "add" | "remove";
      value: string;
    }
  | {
      subtype: "root-customize";
      action: "add" | "remove";
      key: string;
      value?: string[];
    };

// 全部更改逻辑 TODO：重构为 Redux
export const configReducer = (config: Config, action: Action) => {
  const { index } = action as ElementAction;
  const element = config.form;
  const root = config.form;
  switch (action.type) {
    case "load":
      config = action.value;
      break;
    case "info":
      config.info = action.value;
      break;
    case "data":
      switch (action.action) {
        case "add":
          // @ts-ignore
          config.data[action.subtype][action.key] = action.value;
          break;
        case "remove":
          // @ts-ignore
          delete config.data[action.subtype][action.key];
          break;
      }
      break;
    case "element":
      switch (action.subtype) {
        case "generic-alphabet":
          element.alphabet = action.value;
          break;
        case "generic-maxcodelen":
          element.mapping_type = action.value;
          break;
        case "generic-mapping":
          switch (action.action) {
            case "add":
              element.mapping[action.key] = action.value!;
              break;
            case "remove":
              delete element.mapping[action.key];
              break;
          }
          break;
        case "generic-grouping":
          switch (action.action) {
            case "add":
              element.grouping[action.key] = action.value!;
              break;
            case "remove":
              delete element.grouping[action.key];
              break;
          }
          break;
        case "root-degenerator":
          root.analysis = root.analysis || {};
          root.analysis.degenerator = root.analysis.degenerator || {};
          root.analysis.degenerator.feature =
            root.analysis.degenerator.feature || {};
          switch (action.action) {
            case "add":
              root.analysis.degenerator.feature[action.key] = action.value!;
              break;
            case "remove":
              delete root.analysis.degenerator.feature[action.key];
              break;
          }
          break;
        case "root-degenerator-nocross":
          root.analysis = root.analysis || {};
          root.analysis.degenerator = root.analysis.degenerator || {};
          root.analysis.degenerator.no_cross =
            !root.analysis.degenerator.no_cross;
          break;
        case "root-selector":
          root.analysis = root.analysis || {};
          root.analysis.selector = root.analysis.selector || [];
          switch (action.action) {
            case "add":
              root.analysis.selector.push(action.value);
              break;
            case "remove":
              root.analysis.selector = root.analysis.selector.filter(
                (x) => x !== action.value,
              );
              break;
            case "replace":
              root.analysis.selector = action.value;
          }
          break;
        case "root-selector-strongweak":
          root.analysis = root.analysis || {};
          switch (action.action) {
            case "add":
              root.analysis[action.variant] = (
                root.analysis[action.variant] ?? []
              ).concat(action.value);
              break;
            case "remove":
              root.analysis[action.variant] = root.analysis[
                action.variant
              ]?.filter((x) => x !== action.value);
              break;
          }
          break;
        case "root-customize":
          root.analysis = root.analysis || {};
          root.analysis.customize = root.analysis.customize || {};
          switch (action.action) {
            case "add":
              root.analysis.customize[action.key] = action.value!;
              break;
            case "remove":
              delete root.analysis.customize[action.key];
              break;
          }
      }
      break;
    case "encoder":
      config.encoder = action.value;
      break;
  }
  return config;
};

export const ConfigContext = createContext({ data: { form: {} } } as Config);
export const DispatchContext = createContext<Dispatch<Action>>(() => {});

// 以下是在 ConfigContext 基础上的进一步封装，每个字段对应一种简写的办法
// info
const useInfo = () => {
  const { info } = useContext(ConfigContext);
  return info;
};

// data
const useData = () => {
  const { data } = useContext(ConfigContext);
  return data;
};

// form
const useFormConfig = () => {
  const { form } = useContext(ConfigContext);
  return form;
};

const useEncoder = () => {
  const { encoder } = useContext(ConfigContext);
  return encoder;
};

// 以下是在 DispatchContext 基础上的进一步封装
// useDesign 调用 ElementAction
const useDesign = () => {
  const dispatch = useContext(DispatchContext);
  return (action: ElementSubAction) => {
    dispatch({
      type: "element",
      index: "form",
      ...action,
    });
  };
};

// 从页面的路由推导出应该修改哪一组 data
const useDataType = () => {
  const { pathname } = useLocation();
  return pathname.split("/")[3] as keyof Config["data"];
};

// 添加（更新）一个键值对
const useAdd = () => {
  const dispatch = useContext(DispatchContext);
  const subtype = useDataType();
  return (key: DataAction["key"], value: DataAction["value"]) =>
    dispatch({
      type: "data",
      subtype,
      action: "add",
      key,
      value: value as any,
    });
};

// 删除一个键值对
const useRemove = () => {
  const dispatch = useContext(DispatchContext);
  const subtype = useDataType();
  return (key: DataAction["key"]) =>
    dispatch({
      type: "data",
      subtype,
      action: "remove",
      key,
    });
};

export {
  useInfo,
  useData,
  useFormConfig,
  useEncoder,
  useAdd,
  useRemove,
  useDesign,
};
