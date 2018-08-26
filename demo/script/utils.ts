export const parseDate = (dateString:string)=>{
    dateString = `${dateString.slice(0,4)}-${dateString.slice(4,6)}-${dateString.slice(6,8)}`;
    return new Date(dateString);
};

export const formatDate = (timestamp:number, formater:string)=> {
    const dateObj = new Date(timestamp);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const date = dateObj.getDate();
    const monthStr = month > 9 ? month : '0' + month;
    const dateStr = date > 9 ? date : '0' + date;
    let formator = formater || 'YYYY年MM月DD日';

    formator = formator.replace('YYYY', year.toString());
    formator = formator.replace('MM', monthStr.toString());
    formator = formator.replace('DD', dateStr.toString());
    return formator;
};