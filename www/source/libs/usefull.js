function toggleClass(item, classname, toggle) {
    if (!item || !classname) {
        return false;
    }

    item.className.replace(classname, '');

    if (item.clasname.indexOf(classname) < 0 ) {
        item.className += ' ' + classname + ' ';
    }
};