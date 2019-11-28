class Pagination {
    constructor(array, pageSize=10) {
        //then we just need to keep a local reference to the array
        this.arrayToPaginate = array;
        //and we an set the default page size here, across the whole project
        this.pageSize = pageSize;
    }

    getTotalPagesRequired = () => {
        //simple stuff, just get the closest whole number
        return Math.ceil(this.arrayToPaginate.length/this.pageSize);
    }

    getParticularPage = pageNumber => {
        // because pages logically start with 1, but technically with 0
        --pageNumber;
        //then use Array.prototype.slice and just supply the params for (start, end), overflow doesn't matter as it will stop
        return this.arrayToPaginate.slice(pageNumber * this.pageSize, (pageNumber + 1) * this.pageSize);
    }

    buildMenu = pagesRequired => {

        let menu = document.createElement('div');
        menu.className = 'ui right floated pagination menu';
        menu.setAttribute('data-current-page', "1");

        let leftIconHolder = document.createElement('a');
        leftIconHolder.className = 'icon back item';
        menu.appendChild(leftIconHolder);
        
        let leftIcon = document.createElement('i');
        leftIcon.className = 'left chevron icon';
        leftIconHolder.appendChild(leftIcon);

        for (let page = 1; page <= pagesRequired; page++) {
            let pageLink = document.createElement('a');
            pageLink.className = 'item';
            pageLink.setAttribute('data-page-required', page);
            pageLink.textContent = page;
            menu.appendChild(pageLink);
        }

        let rightIconHolder = document.createElement('a');
        rightIconHolder.className = 'icon forward item';
        menu.appendChild(rightIconHolder);
        
        let rightIcon = document.createElement('i');
        rightIcon.className = 'right chevron icon';
        rightIconHolder.appendChild(rightIcon);

        return menu;

    } 

}