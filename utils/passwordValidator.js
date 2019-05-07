
module.exports.validatePassword = (password,username,cname) => {
    
    /*Password Check for
        1. Be at least seven characters in length
        2. Contain characters from three of the following four categories:
            a) English uppercase characters (A through Z)
            b) English lowercase characters (a through z)
            c) Base 10 digits (0 through 9)
            d) Non-alphabetic characters (for example, !, $, #, %)
    */        
    let regex1 = /^((?=.*?[A-Z])(?=.*?[a-z])(?=.*?\d)|(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[^a-zA-Z0-9])|(?=.*?[A-Z])(?=.*?\d)(?=.*?[^a-zA-Z0-9])|(?=.*?[a-z])(?=.*?\d)(?=.*?[^a-zA-Z0-9])).{7,}$/
    if(!regex1.test(password)) {
        return false;
    }

    /*Password check
      Password should not contain the user's account name*/    
    var regex2 = new RegExp(username,"i");
    if(regex2.test(password)) {
        return false;
    }


    /*Password check
      Password should not contain parts of the user's full name that exceed two consecutive characters*/
    let regex3;
    let regexArray = [];

    for(let i=0;i<cname.length;i++) {
            if((i+3) <= cname.length) {
            
            let substr = cname.substring(i, i+3);
            regexArray.push(substr);
        }
    }
   
    regex3 = new RegExp(regexArray.join('|'),"i");
    if(regex3.test(password)) {
        return false;
    }
    return true;
}

