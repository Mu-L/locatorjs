import { Fiber, Targets } from "@locator/shared";
import { batch, createEffect, createSignal, For, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { Adapter, HREF_TARGET } from "./consts";
import { fiberToSimple } from "./adapters/react/fiberToSimple";
import { gatherFiberRoots } from "./adapters/react/gatherFiberRoots";
import reactAdapter from "./adapters/react/reactAdapter";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { trackClickStats } from "./trackClickStats";
import { SimpleNode, Targets as SetupTargets } from "./types";
import { getIdsOnPathToRoot } from "./getIdsOnPathToRoot";
import { RootTreeNode } from "./RootTreeNode";
import { MaybeOutline } from "./MaybeOutline";
import { SimpleNodeOutline } from "./SimpleNodeOutline";
import { hasExperimentalFeatures } from "./hasExperimentalFeatures";
import jsxAdapter from "./adapters/jsx/jsxAdapter";
import { AdapterObject } from "./adapters/adapterApi";
import LogoIcon from "./LogoIcon";
import { IntroInfo } from "./IntroInfo";
import { Options } from "./Options";
import { isExtension } from "./isExtension";
import { OpenOptionsButton } from "./OpenOptionsButton";
import { bannerClasses } from "./bannerClasses";

function Runtime(props: { adapter: AdapterObject; targets: Targets }) {
  const [uiMode, setUiMode] = createSignal<
    ["off"] | ["options"] | ["tree"] | ["treeFromElement", HTMLElement]
  >(["off"]);
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );

  const [highlightedNode, setHighlightedNode] = createSignal<null | SimpleNode>(
    null
  );

  createEffect(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  createEffect(() => {
    if (uiMode()[0] === "tree" || uiMode()[0] === "treeFromElement") {
      document.body.classList.add("locatorjs-move-body");
    } else {
      document.body.classList.remove("locatorjs-move-body");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    if (hasExperimentalFeatures()) {
      if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
        if (uiMode()[0] === "tree") {
          setUiMode(["off"]);
        } else {
          setUiMode(["tree"]);
        }
      }
    }

    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function keyDownListener(e: KeyboardEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function mouseOverListener(e: MouseEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e));

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      // Ignore LocatorJS elements
      if (
        target.className == "locatorjs-label" ||
        target.id == "locatorjs-labels-section" ||
        target.id == "locatorjs-layer" ||
        target.id == "locatorjs-wrapper" ||
        target.matches("#locatorjs-wrapper *")
      ) {
        return;
      }

      batch(() => {
        setCurrentElement(target);
        // TODO: this is for highlighting elements in the tree, but need to move it to the adapter
        // if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
        //   const fiber = findFiberByHtmlElement(target, false);
        //   if (fiber) {
        //     const id = fiberToSimple(fiber, []);
        //     setHighlightedNode(id);
        //   }
        // }
      });

      // const found =
      //   target.closest("[data-locatorjs-id]") ||
      //   searchDevtoolsRenderersForClosestTarget(target);
      // if (found && found instanceof HTMLElement) {
      //   setCurrentElement(found);
      // }
    }
  }

  function clickListener(e: MouseEvent) {
    if (!isCombinationModifiersPressed(e)) {
      return;
    }

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (target.matches("#locatorjs-wrapper *")) {
        return;
      }

      const elInfo = props.adapter.getElementInfo(target);

      if (elInfo) {
        const link = elInfo.thisElement.link;
        if (link) {
          e.preventDefault();
          e.stopPropagation();
          trackClickStats();
          window.open(link, HREF_TARGET);
        } else {
          alert("No link found");
        }
      }
    }
  }

  function scrollListener() {
    setCurrentElement(null);
  }

  document.addEventListener("mouseover", mouseOverListener, {
    capture: true,
  });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  document.addEventListener("click", clickListener, { capture: true });
  document.addEventListener("scroll", scrollListener);

  onCleanup(() => {
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true,
    });
    document.removeEventListener("click", clickListener, { capture: true });
    document.removeEventListener("scroll", scrollListener);
  });

  const getAllNodes = (): SimpleNode[] => {
    if (uiMode()[0] === "tree" || uiMode()[0] === "treeFromElement") {
      const foundFiberRoots: Fiber[] = [];

      gatherFiberRoots(document.body, foundFiberRoots);

      const simpleRoots = foundFiberRoots.map((fiber) => {
        return fiberToSimple(fiber);
      });

      return simpleRoots;
    }
    //  else if () {
    //   const pathToParentTree = getIdsOnPathToRoot(solidMode()[1]!);
    //   if (pathToParentTree) {
    //     return [pathToParentTree];
    //   }
    // }
    return [];
  };

  function showTreeFromElement(element: HTMLElement) {
    setUiMode(["treeFromElement", element]);
  }

  function openOptions() {
    setUiMode(["options"]);
  }
  return (
    <>
      {uiMode()[0] === "tree" || uiMode()[0] === "treeFromElement" ? (
        <div
          // id="locator-solid-overlay"
          // onClick={(e) => {
          //   setSolidMode(["off"]);
          // }}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "50vw",
            height: "100vh",
            overflow: "auto",
            "pointer-events": "auto",
          }}
        >
          <For each={getAllNodes()}>
            {(node) => (
              <RootTreeNode
                node={node}
                idsToShow={
                  uiMode()[0] === "treeFromElement"
                    ? getIdsOnPathToRoot(uiMode()[1]!)
                    : {}
                }
                highlightedNode={{
                  getNode: highlightedNode,
                  setNode: (newId) => {
                    setHighlightedNode(newId);
                  },
                }}
              />
            )}
          </For>
          {/* <For each={getAllNodes()}>
            {(node, i) => (
              <RenderXrayNode node={node} parentIsHovered={false} />
            )}
          </For> */}
        </div>
      ) : null}
      {holdingModKey() && currentElement() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          showTreeFromElement={showTreeFromElement}
          adapter={props.adapter}
        />
      ) : null}
      {holdingModKey() ? (
        <div class={bannerClasses()}>
          <div class="flex justify-between gap-2">
            <LogoIcon />
            {!isExtension() ? (
              <OpenOptionsButton
                onClick={() => {
                  openOptions();
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      {highlightedNode() ? (
        <SimpleNodeOutline node={highlightedNode()!} />
      ) : null}
      <IntroInfo
        openOptions={openOptions}
        hide={!!holdingModKey() || uiMode()[0] !== "off"}
      />
      {uiMode()[0] === "options" ? (
        <Options
          targets={props.targets}
          onClose={() => {
            setUiMode(["off"]);
          }}
        />
      ) : null}
      {/* {holdingModKey() &&
      currentElement() &&
      getElementInfo(currentElement()!) ? (
        <Outline element={getElementInfo(currentElement()!)!} />
      ) : null} */}
    </>
  );
}

export function initRender(
  solidLayer: HTMLDivElement,
  adapter: Adapter,
  targets: SetupTargets
) {
  const adapterObject = adapter === "jsx" ? jsxAdapter : reactAdapter;
  render(
    () => (
      <Runtime
        adapter={adapterObject}
        targets={Object.fromEntries(
          Object.entries(targets).map(([key, t]) => {
            return [key, typeof t == "string" ? { url: t, label: key } : t];
          })
        )}
      />
    ),
    solidLayer
  );
}
