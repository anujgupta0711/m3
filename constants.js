function define(key, value){
   Object.defineProperty(exports, key, {
      value: value,
      enumerable: true,
   });
}

define("SELECT_DISH_TABLE_QUERY","SELECT DISH_ID FROM DISH WHERE DISH_NAME = $1");