function renameNode(node: SceneNode, isInsideComponentOrInstance: boolean = false, isRootNode: boolean = true): number {
  let renamedCount = 0;

  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    if ('children' in node) {
      for (const child of node.children) {
        renamedCount += renameNode(child, true, false);
      }
    }
    return renamedCount;
  }

  if (!isInsideComponentOrInstance) {
    let renamed = false;
    if (isRootNode && node.type === 'FRAME' && 'width' in node && node.width === 1680) {
      (node as BaseNode).name = 'Screen';
      renamed = true;
    } else if (isMask(node)) {
      (node as BaseNode).name = 'Mask';
      renamed = true;
      if (node.parent && node.parent.type === 'GROUP') {
        node.parent.name = 'Mask Group';
        renamedCount++;
      }
    } else if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'VECTOR') {
      if ('fills' in node && 'strokes' in node) {
        if (hasOnlyStroke(node)) {
          (node as BaseNode).name = 'Line';
        } else if (Array.isArray(node.fills) && node.fills.length > 0) {
          if (node.fills.some((fill: Paint) => fill.type === 'IMAGE')) {
            (node as BaseNode).name = 'Image';
          } else if (node.fills.some((fill: Paint) => {
            return fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' || 
                   fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND';
          })) {
            (node as BaseNode).name = 'Gradient';
          } else {
            (node as BaseNode).name = 'Shape';
          }
        } else {
          (node as BaseNode).name = 'Shape';
        }
      } else {
        (node as BaseNode).name = 'Shape';
      }
      renamed = true;
    } else if (node.type === 'LINE') {
      (node as BaseNode).name = 'Line';
      renamed = true;
    } else if (node.type === 'FRAME') {
      if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        (node as BaseNode).name = 'Wrapper';
        if (node.parent && (node.parent.type === 'FRAME' || node.parent.type === 'COMPONENT' || node.parent.type === 'INSTANCE') && 'layoutMode' in node.parent && node.parent.layoutMode !== 'NONE') {
          (node as BaseNode).name = node.layoutMode === 'VERTICAL' ? 'Inner-column' : 'Inner-row';
        }
      } else {
        (node as BaseNode).name = 'Contain';
      }
      renamed = true;
    } else if (node.type === 'GROUP') {
      if (node.children.some(child => isMask(child))) {
        (node as BaseNode).name = 'Mask Group';
      } else {
        (node as BaseNode).name = 'Group';
      }
      renamed = true;
    }
    if (renamed) renamedCount++;
  }

  if ('children' in node) {
    for (const child of node.children) {
      renamedCount += renameNode(child, isInsideComponentOrInstance, false);
    }
  }

  return renamedCount;
}

function isMask(node: SceneNode): boolean {
  return (
    (node.type === 'BOOLEAN_OPERATION' && 'isMask' in node && node.isMask) ||
    ((node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'VECTOR') && 'isMask' in node && node.isMask)
  );
}

function hasOnlyStroke(node: SceneNode & { fills?: readonly Paint[] | typeof figma.mixed, strokes?: readonly Paint[] | typeof figma.mixed }): boolean {
  return (
    Array.isArray(node.fills) && node.fills.length === 0 &&
    Array.isArray(node.strokes) && node.strokes.length > 0
  );
}

const selection = figma.currentPage.selection;

if (selection.length > 0) {
  let totalRenamed = 0;
  for (const node of selection) {
    totalRenamed += renameNode(node);
  }
  figma.notify(`✨ Done, ${totalRenamed} Layers Renamed ✨`);
} else {
  figma.notify('Bitte wählen Sie mindestens einen Frame aus');
}

figma.closePlugin();