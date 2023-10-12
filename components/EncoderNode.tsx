import { Button, Dropdown } from "antd";
import { useContext } from "react";
import { Handle, NodeProps, Position, useReactFlow } from "reactflow";
import { ConfigContext } from "./context";
import styled from "styled-components";
import {
  MenuItemGroupType,
  MenuItemType,
  SubMenuType,
} from "antd/es/menu/hooks/useItems";
import {
  ENode,
  NodeData,
  EEdge,
  EdgeData,
  makeEdge,
  getLayoutedElements,
  makeNode,
} from "./graph";

const NodeButton = styled(Button)`
  width: 64px;
  height: 32px;
  padding: 4px;
`;

const EncoderNode = ({ id, data }: NodeProps<NodeData>) => {
  const { elements } = useContext(ConfigContext);
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow<
    NodeData,
    EdgeData
  >();
  const allNodes = elements.map(({ nodes }) => nodes).flat();
  const updateNode: MenuItemGroupType = {
    key: "update",
    type: "group",
    label: "更改节点",
    children: allNodes
      .filter((v) => v !== data.label)
      .map((key) => ({
        key,
        label: key,
        onClick: () => {
          setNodes((nodes) =>
            nodes.map((node) => {
              if (node.id === id) {
                node.data = { label: key };
              }
              return node;
            }),
          );
        },
      })),
  };
  const setLayout = (newnodes: ENode[], newedges: EEdge[]) => {
    const [lnodes, ledges] = getLayoutedElements(newnodes, newedges);
    setNodes(lnodes);
    setEdges(ledges);
  };
  const createNode: SubMenuType = {
    key: "create",
    label: "添加节点",
    children: allNodes.map((key) => ({
      key: "create" + key,
      label: key,
      onClick: () => {
        const [nodes, edges] = [getNodes(), getEdges()];
        let newid = 0;
        for (const node of nodes) {
          if (node.id !== newid.toString()) break;
          newid += 1;
        }
        const newnodes = nodes
          .concat(makeNode(newid, key))
          .sort((a, b) => parseInt(a.id) - parseInt(b.id));
        const newedges = edges.concat(makeEdge(parseInt(id), newid, []));
        setLayout(newnodes, newedges);
      },
    })),
  };
  const deleteNode: MenuItemType = {
    key: "delete",
    label: "删除节点",
    onClick: () => {
      const newnodes = getNodes().filter((n) => n.id !== id);
      const newedges = getEdges().filter(
        ({ source, target }) => ![source, target].includes(id),
      );
      setLayout(newnodes, newedges);
    },
  };
  const items: (MenuItemType | MenuItemGroupType)[] =
    id === "0" ? [createNode] : [updateNode, createNode, deleteNode];

  return (
    <>
      <Dropdown menu={{ items }} placement="bottom">
        <NodeButton type={id === "0" ? "primary" : "default"}>
          {data.label}
        </NodeButton>
      </Dropdown>
      {id !== "0" && <Handle type="target" position={Position.Top} />}
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

export default EncoderNode;
