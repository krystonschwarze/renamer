// Function to rename a node and its children
function renameNode(node: SceneNode, isInsideComponentOrInstance: boolean = false, isRootNode: boolean = true): number {
  let renamedCount = 0;

  // Special handling for components and instances
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    if ('children' in node) {
      for (const child of node.children) {
        renamedCount += renameNode(child, true, false);
      }
    }
    return renamedCount;
  }

  // Main logic for renaming nodes
  if (!isInsideComponentOrInstance) {
    let renamed = false;
    // Rename based on node type and properties
    if (isRootNode && node.type === 'FRAME' && 'width' in node && node.width === 1680) {
      (node as BaseNode).name = 'Screen';
      renamed = true;
    } else if (isMask(node)) {
      (node as BaseNode).name = 'Mask';
      renamed = true;
      // Rename parent group if it's a mask
      if (node.parent && node.parent.type === 'GROUP') {
        node.parent.name = 'Mask Group';
        renamedCount++;
      }
    } else if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'VECTOR') {
      // Rename shapes based on their fills and strokes
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
      // Rename frames based on their layout mode or height
      if ('height' in node && node.height === 1) {
        (node as BaseNode).name = 'Divider';
      } else if ('layoutMode' in node && node.layoutMode !== 'NONE') {
        (node as BaseNode).name = 'Wrapper';
        if (node.parent && (node.parent.type === 'FRAME' || node.parent.type === 'COMPONENT' || node.parent.type === 'INSTANCE') && 'layoutMode' in node.parent && node.parent.layoutMode !== 'NONE') {
          (node as BaseNode).name = node.layoutMode === 'VERTICAL' ? 'Inner-column' : 'Inner-row';
        }
      } else {
        (node as BaseNode).name = 'Contain';
      }
      renamed = true;
    } else if (node.type === 'GROUP') {
      // Rename groups
      if (node.children.some(child => isMask(child))) {
        (node as BaseNode).name = 'Mask Group';
      } else {
        (node as BaseNode).name = 'Group';
      }
      renamed = true;
    }
    if (renamed) renamedCount++;
  }

  // Recursively rename children
  if ('children' in node) {
    for (const child of node.children) {
      renamedCount += renameNode(child, isInsideComponentOrInstance, false);
    }
  }

  return renamedCount;
}

// Function to check if a node is a mask
function isMask(node: SceneNode): boolean {
  return (
    (node.type === 'BOOLEAN_OPERATION' && 'isMask' in node && node.isMask) ||
    ((node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'VECTOR') && 'isMask' in node && node.isMask)
  );
}

// Function to check if a node has only a stroke
function hasOnlyStroke(node: SceneNode & { fills?: readonly Paint[] | typeof figma.mixed, strokes?: readonly Paint[] | typeof figma.mixed }): boolean {
  return (
    Array.isArray(node.fills) && node.fills.length === 0 &&
    Array.isArray(node.strokes) && node.strokes.length > 0
  );
}

// Main plugin logic
const selection = figma.currentPage.selection;

if (selection.length > 0) {
  let totalRenamed = 0;
  for (const node of selection) {
    totalRenamed += renameNode(node);
  }
  // Notify about the number of renamed layers
  figma.notify(`✨ Done, ${totalRenamed} Layer${totalRenamed !== 1 ? 's' : ''} Renamed ✨`);
} else {
  // Notify if no selection was made
  figma.notify(`🙈 Oops! Please select at least one frame to get started 🎨`);
}

// Close the plugin
figma.closePlugin();