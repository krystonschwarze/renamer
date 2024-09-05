"use strict";
// Function to rename a node and its children
function renameNode(node, isInsideComponentOrInstance = false, isRootNode = true) {
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
    // List of names to preserve
    const preserveNames = ['Headline', 'Head', 'Top', 'Bottom', 'Label', 'Paragraph'];
    if (!isInsideComponentOrInstance && preserveNames.indexOf(node.name) === -1) {
        let newName = '';
        // Rename based on node type and properties
        if (isRootNode && node.type === 'FRAME' && 'width' in node && node.width === 1680) {
            newName = 'Screen';
        }
        else if (isMask(node)) {
            newName = 'Mask';
            if (node.parent && node.parent.type === 'GROUP') {
                node.parent.name = 'Mask Group';
                renamedCount++;
            }
        }
        else if (node.type === 'TEXT') {
            // For text layers, use the actual text content as the name
            newName = node.characters.slice(0, 50); // Limit to 50 characters
            if (node.characters.length > 50) {
                newName += '...'; // Add ellipsis if text is longer than 50 characters
            }
        }
        else if (node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'VECTOR') {
            if ('fills' in node && 'strokes' in node) {
                if (hasOnlyStroke(node)) {
                    newName = 'Line';
                }
                else if (Array.isArray(node.fills) && node.fills.length > 0) {
                    if (node.fills.some((fill) => fill.type === 'IMAGE')) {
                        newName = 'Image';
                    }
                    else if (node.fills.some((fill) => {
                        return fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL' ||
                            fill.type === 'GRADIENT_ANGULAR' || fill.type === 'GRADIENT_DIAMOND';
                    })) {
                        newName = 'Gradient';
                    }
                    else {
                        newName = 'Shape';
                    }
                }
                else {
                    newName = 'Shape';
                }
            }
            else {
                newName = 'Shape';
            }
        }
        else if (node.type === 'LINE') {
            newName = 'Line';
        }
        else if (node.type === 'FRAME') {
            // Rename frames based on their layout mode or height
            if ('height' in node && node.height === 1) {
                newName = 'Divider';
            }
            else if ('layoutMode' in node && node.layoutMode !== 'NONE') {
                newName = 'Wrapper';
                if (node.parent && (node.parent.type === 'FRAME' || node.parent.type === 'COMPONENT' || node.parent.type === 'INSTANCE') && 'layoutMode' in node.parent && node.parent.layoutMode !== 'NONE') {
                    newName = node.layoutMode === 'VERTICAL' ? 'Inner-column' : 'Inner-row';
                }
            }
            else {
                newName = 'Contain';
            }
        }
        else if (node.type === 'GROUP') {
            if (node.children.some(child => isMask(child))) {
                newName = 'Mask Group';
            }
            else {
                newName = 'Group';
            }
        }
        if (newName && node.name !== newName) {
            node.name = newName;
            renamedCount++;
        }
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
function isMask(node) {
    return ((node.type === 'BOOLEAN_OPERATION' && 'isMask' in node && node.isMask) ||
        ((node.type === 'RECTANGLE' || node.type === 'ELLIPSE' || node.type === 'POLYGON' || node.type === 'STAR' || node.type === 'VECTOR') && 'isMask' in node && node.isMask));
}
// Function to check if a node has only a stroke
function hasOnlyStroke(node) {
    return (Array.isArray(node.fills) && node.fills.length === 0 &&
        Array.isArray(node.strokes) && node.strokes.length > 0);
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
}
else {
    // Notify if no selection was made
    figma.notify(`🙈 Oops! Please select at least one frame to get started 🎨`);
}
// Close the plugin
figma.closePlugin();
