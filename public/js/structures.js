const structureTrees = {
    org: [
        {
            id: 'ceo',
            title: 'الرئيس التنفيذي',
            person: 'بسام الحلبي',
            color: '#2563EB',
            collapsed: false,
            children: [
                {
                    id: 'ops',
                    title: 'نائب الرئيس للعمليات',
                    person: 'سمر الديري',
                    color: '#F97316',
                    collapsed: false,
                    children: [
                        { id: 'production', title: 'إدارة الإنتاج', person: 'غسان قنوع', color: '#FDBA74', collapsed: true, children: [] },
                        { id: 'quality', title: 'إدارة الجودة', person: 'هبة حيدر', color: '#FB923C', collapsed: true, children: [] }
                    ]
                },
                {
                    id: 'finance',
                    title: 'نائب الرئيس للمالية',
                    person: 'خالد الحموي',
                    color: '#10B981',
                    collapsed: false,
                    children: [
                        { id: 'accounting', title: 'المحاسبة', person: 'رنا حسون', color: '#34D399', collapsed: true, children: [] },
                        { id: 'planning', title: 'التخطيط المالي', person: 'ليث بركات', color: '#059669', collapsed: true, children: [] }
                    ]
                },
                {
                    id: 'marketing',
                    title: 'نائب الرئيس للتسويق',
                    person: 'نورا الشامي',
                    color: '#EC4899',
                    collapsed: false,
                    children: [
                        { id: 'digital', title: 'التسويق الرقمي', person: 'ليان دغمش', color: '#F472B6', collapsed: true, children: [] },
                        { id: 'sales', title: 'إدارة المبيعات', person: 'وسيم فتال', color: '#DB2777', collapsed: true, children: [] }
                    ]
                },
                {
                    id: 'hr',
                    title: 'نائب الرئيس للموارد البشرية',
                    person: 'فادي دمشق',
                    color: '#8B5CF6',
                    collapsed: false,
                    children: [
                        { id: 'recruitment', title: 'إدارة التوظيف', person: 'ميسون شحادة', color: '#A78BFA', collapsed: true, children: [] },
                        { id: 'training', title: 'إدارة التدريب', person: 'يمنى سويد', color: '#7C3AED', collapsed: true, children: [] }
                    ]
                }
            ]
        }
    ],
    job: []
};

const treeContainers = {
    org: ['org-structure-tree', 'org-structure-guide-tree'],
    job: ['job-structure-tree', 'job-structure-guide-tree']
};

const departmentColorPalette = ['#2563EB', '#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#FB7185', '#14B8A6'];
let departmentColorIndex = 0;

const jobLevelColors = {
    'سوية إدارية عليا': '#312E81',
    'سوية إدارية': '#4338CA',
    'سوية إشرافية': '#C2410C',
    'سوية تنفيذية': '#047857'
};

function getNextDepartmentColor() {
    const color = departmentColorPalette[departmentColorIndex % departmentColorPalette.length];
    departmentColorIndex += 1;
    return color;
}

function hexToRgba(hex, alpha) {
    let sanitized = hex.replace('#', '');
    if (sanitized.length === 3) {
        sanitized = sanitized.split('').map((c) => c + c).join('');
    }
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getNodeColor(node, type) {
    if (type === 'org') {
        if (!node.color) {
            node.color = getNextDepartmentColor();
        }
        return node.color;
    }
    return jobLevelColors[node.level] || '#64748B';
}

function getJobLevelByDepth(depth) {
    if (depth === 0) return 'سوية إدارية عليا';
    if (depth === 1) return 'سوية إدارية';
    if (depth === 2) return 'سوية إشرافية';
    return 'سوية تنفيذية';
}

function cloneOrgNodeToJob(node, depth = 0) {
    return {
        id: `job-${node.id}`,
        title: node.title,
        level: getJobLevelByDepth(depth),
        collapsed: node.collapsed ?? false,
        children: (node.children || []).map(child => cloneOrgNodeToJob(child, depth + 1))
    };
}

function rebuildJobTreeFromOrg() {
    structureTrees.job = structureTrees.org.map(node => cloneOrgNodeToJob(node));
}

function getOrgLevelLabel(depth) {
    if (depth === 0) return 'مستوى قيادي';
    if (depth === 1) return 'مستوى إداري';
    if (depth === 2) return 'مستوى إشرافي';
    return 'مستوى تنفيذي';
}

function flattenOrgTree(nodes, depth = 0, parentTitle = '—', result = []) {
    nodes.forEach(node => {
        result.push({
            level: getOrgLevelLabel(depth),
            title: node.title,
            person: node.person || 'غير محدد',
            parent: depth === 0 ? '—' : parentTitle
        });
        if (node.children && node.children.length) {
            flattenOrgTree(node.children, depth + 1, node.title, result);
        }
    });
    return result;
}

function renderStructureGuideTable() {
    const body = document.getElementById('structure-guide-table-body');
    if (!body) return;

    const rows = flattenOrgTree(structureTrees.org);
    if (!rows.length) {
        body.innerHTML = `<tr><td class="py-3 px-4 text-gray-400 text-center" colspan="4">لا توجد بيانات بعد.</td></tr>`;
        return;
    }

    body.innerHTML = rows.map(row => `
        <tr>
            <td class="py-2 px-4 text-primary font-medium">${row.level}</td>
            <td class="py-2 px-4 font-semibold">${row.title}</td>
            <td class="py-2 px-4 text-gray-700">${row.person}</td>
            <td class="py-2 px-4 text-gray-500">${row.parent}</td>
        </tr>
    `).join('');
}

let currentDragNodeId = null;
let currentDragType = null;
let currentDragOverId = null;

function initStructureTrees() {
    rebuildJobTreeFromOrg();
    renderAllTrees();
    renderStructureGuideTable();

    document.addEventListener('click', (event) => {
        const controlButton = event.target.closest('[data-tree-control]');
        if (controlButton) {
            event.preventDefault();
            handleTreeControl(controlButton);
            return;
        }

        const addButton = event.target.closest('[data-tree-add]');
        if (addButton) {
            event.stopPropagation();
            addChildNode(addButton.dataset.treeType, addButton.dataset.nodeId);
            return;
        }

        const card = event.target.closest('[data-tree-card]');
        if (card) {
            toggleNode(card.dataset.treeType, card.dataset.nodeId);
        }
    });

    document.addEventListener('dragstart', (event) => {
        const card = event.target.closest('[data-tree-card]');
        if (!card) return;
        currentDragNodeId = card.dataset.nodeId;
        currentDragType = card.dataset.treeType;
        event.dataTransfer.effectAllowed = 'move';
        card.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    });

    document.addEventListener('dragover', (event) => {
        const card = event.target.closest('[data-tree-card]');
        if (!card || !currentDragNodeId) return;
        if (card.dataset.nodeId === currentDragNodeId) return;
        if (card.dataset.treeType !== currentDragType) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        if (currentDragOverId !== card.dataset.nodeId) {
            clearDragOverHighlight();
            currentDragOverId = card.dataset.nodeId;
            card.classList.add('ring-2', 'ring-orange-400', 'ring-offset-2');
        }
    });

    document.addEventListener('drop', (event) => {
        const card = event.target.closest('[data-tree-card]');
        if (!card || !currentDragNodeId) return;
        event.preventDefault();

        const targetId = card.dataset.nodeId;
        const type = card.dataset.treeType;
        if (type !== currentDragType || targetId === currentDragNodeId) {
            currentDragNodeId = null;
            currentDragType = null;
            return;
        }

        if (!moveNodeToNewParent(type, currentDragNodeId, targetId)) {
            currentDragNodeId = null;
            currentDragType = null;
            clearDragOverHighlight();
            return;
        }

        if (type === 'org') {
            handleOrgStructureChanged();
        } else {
            refreshTree('job');
        }

        currentDragNodeId = null;
        currentDragType = null;
        clearDragOverHighlight();
    });
}

function clearDragOverHighlight() {
    if (!currentDragOverId) return;
    document.querySelectorAll('[data-tree-card]').forEach(card => {
        card.classList.remove('ring-2', 'ring-orange-400', 'ring-offset-2');
        card.classList.remove('ring-primary');
    });
    currentDragOverId = null;
}

function moveNodeToNewParent(type, sourceId, targetId) {
    const roots = structureTrees[type];
    if (!roots || sourceId === targetId) return false;

    const { node: sourceNode, parent: sourceParent } = findNodeWithParent(roots, sourceId);
    const { node: targetNode } = findNodeWithParent(roots, targetId);

    if (!sourceNode || !targetNode) return false;

    // منع إسقاط العقدة داخل أحد أحفادها
    if (isDescendant(sourceNode, targetId)) return false;

    // إزالة من الأب القديم
    const siblings = sourceParent ? sourceParent.children : roots;
    const idx = siblings.findIndex(n => n.id === sourceId);
    if (idx === -1) return false;
    siblings.splice(idx, 1);

    // إضافته كابن في الهدف
    targetNode.children = targetNode.children || [];
    targetNode.children.unshift(sourceNode);

    return true;
}

function findNodeWithParent(nodes, nodeId, parent = null) {
    for (const node of nodes) {
        if (node.id === nodeId) {
            return { node, parent };
        }
        if (node.children && node.children.length) {
            const found = findNodeWithParent(node.children, nodeId, node);
            if (found.node) return found;
        }
    }
    return { node: null, parent: null };
}

function isDescendant(rootNode, targetId) {
    if (!rootNode.children) return false;
    for (const child of rootNode.children) {
        if (child.id === targetId) return true;
        if (isDescendant(child, targetId)) return true;
    }
    return false;
}

function handleTreeControl(button) {
    const { treeType, treeAction } = button.dataset;
    if (!treeType || !treeAction) return;
    setTreeCollapsed(treeType, treeAction !== 'expand');
}

function renderAllTrees() {
    Object.keys(treeContainers).forEach((type) => {
        treeContainers[type].forEach((containerId) => {
            renderTree(containerId, structureTrees[type], type);
        });
    });
}

function renderTree(containerId, nodes, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!nodes || !nodes.length) {
        container.innerHTML = '<p class="text-center text-gray-400">لا توجد عناصر في هذه الشجرة بعد.</p>';
        return;
    }

    container.innerHTML = nodes.map((node) => createNodeMarkup(node, type, true)).join('');
}

function createNodeMarkup(node, type, isRoot = false) {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const toggleIcon = node.collapsed ? 'fa-plus' : 'fa-minus';
    const nodeColor = getNodeColor(node, type);
    const metaLine = type === 'org'
        ? (node.person ? `<p class="text-xs font-medium mt-1" style="color:${nodeColor}">المسؤول: ${node.person}</p>` : '')
        : `<span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background-color:${hexToRgba(nodeColor, 0.15)}; color:${nodeColor}; border:1px solid ${hexToRgba(nodeColor, 0.35)}">السوية: ${node.level || 'سوية إدارية'}</span>`;

    const childrenMarkup = hasChildren
        ? `<div class="tree-children ${node.collapsed ? 'hidden' : ''}">
                ${node.children.map((child) => createNodeMarkup(child, type, false)).join('')}
           </div>`
        : '';

    const branchClasses = ['tree-branch'];
    if (hasChildren) branchClasses.push('has-children');
    if (isRoot) branchClasses.push('tree-root');

    const cardStyle = `style="border-color:${nodeColor}; box-shadow:0 12px 24px ${hexToRgba(nodeColor, 0.18)}; background:linear-gradient(140deg, ${hexToRgba(nodeColor, 0.12)} 0%, #ffffff 70%);" `;
    const iconElement = hasChildren
        ? `<span class="w-8 h-8 rounded-full flex items-center justify-center" style="background-color:${hexToRgba(nodeColor, 0.15)}; color:${nodeColor}; border:1px solid ${hexToRgba(nodeColor, 0.35)}">
                <i class="fas ${toggleIcon}"></i>
           </span>`
        : `<span class="w-8 h-8 rounded-full flex items-center justify-center" style="border:1px dashed #CBD5F5; color:#94A3B8">
                <i class="fas fa-circle text-[10px]"></i>
           </span>`;

    return `
        <div class="${branchClasses.join(' ')}" data-node-id="${node.id}">
            <div class="tree-node space-y-3 ${hasChildren ? 'cursor-pointer' : ''}" ${cardStyle} data-tree-card data-tree-type="${type}" data-node-id="${node.id}" draggable="${type === 'org' ? 'true' : 'false'}">
                <div class="tree-node-header">
                    <div class="flex items-start gap-3">
                        ${iconElement}
                        <div class="text-right">
                            <p class="font-semibold text-gray-800">${node.title}</p>
                            ${metaLine}
                        </div>
                    </div>
                    <button class="tree-add-button" title="إضافة مستوى فرعي" data-tree-add data-tree-type="${type}" data-node-id="${node.id}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            ${childrenMarkup}
        </div>
    `;
}

function toggleNode(type, nodeId) {
    const node = findNodeById(structureTrees[type], nodeId);
    if (!node) return;
    const newState = !node.collapsed;
    node.collapsed = newState;
    setDescendantsCollapse(node, newState);
    refreshTree(type);
}

function setDescendantsCollapse(node, collapsed) {
    if (!node.children || !node.children.length) return;
    node.children.forEach((child) => {
        child.collapsed = collapsed;
        setDescendantsCollapse(child, collapsed);
    });
}

function addChildNode(type, parentId) {
    const parent = findNodeById(structureTrees[type], parentId);
    if (!parent) return;

    const titlePrompt = type === 'org' ? 'اسم المستوى أو القسم الجديد:' : 'اسم الوظيفة أو المسمى الجديد:';
    const detailPrompt = type === 'org' ? 'اسم المسؤول عن هذا المستوى (اختياري):' : 'حدد المستوى/الرمز الوظيفي (اختياري):';

    const title = prompt(titlePrompt);
    if (!title) return;

    const detail = prompt(detailPrompt) || '';

    const newNode = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        collapsed: true,
        children: []
    };

    if (type === 'org') {
        newNode.person = detail.trim() || 'غير محدد';
        newNode.color = getNextDepartmentColor();
    } else {
        newNode.level = detail.trim() || 'سوية إدارية';
    }

    parent.children = parent.children || [];
    parent.children.unshift(newNode);
    parent.collapsed = false;

    if (type === 'org') {
        handleOrgStructureChanged();
    }

    refreshTree(type);
}

function setTreeCollapsed(type, collapsed) {
    traverseNodes(structureTrees[type], (node) => {
        node.collapsed = collapsed;
    });
    refreshTree(type);
}

function refreshTree(type) {
    treeContainers[type].forEach((containerId) => {
        renderTree(containerId, structureTrees[type], type);
    });
}

function findNodeById(nodes, nodeId) {
    for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children && node.children.length) {
            const found = findNodeById(node.children, nodeId);
            if (found) return found;
        }
    }
    return null;
}

function traverseNodes(nodes, callback) {
    nodes.forEach((node) => {
        callback(node);
        if (node.children && node.children.length) {
            traverseNodes(node.children, callback);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStructureTrees);
} else {
    initStructureTrees();
}

function handleOrgStructureChanged() {
    rebuildJobTreeFromOrg();
    renderStructureGuideTable();
    refreshTree('job');
}

