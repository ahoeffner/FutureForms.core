/*
  MIT License

  Copyright © 2023 Alex Høffner

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software
  and associated documentation files (the “Software”), to deal in the Software without
  restriction, including without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or
  substantial portions of the Software.

  THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { Query } from "../Query.js";


export enum WeekDays
{
   Sunday,
   Monday,
   Tuesday,
   Wednesday,
   Thursday,
   Friday,
   Saturday
}


export class Dates
{
   /**
    * Helper filters for dealing with date columns.
    * When selecting data for a given date, it is necessary to.
    * query from (including) the beginning of that day until the beginning of next dsy (excluding).
    */

   private static DAY:number = 1000*60*60*24;

   /**
    *
    * @param column  The table column
    * @param date    The given date
    * @returns       A filter representing this condition
    */
   public AtThisDay(column:string, date?:Date) : Filter
   {
      if (!date) date = new Date();
      let filter:Filter = new Filter();
      filter["type"] = "daterange";
      filter["column"] = column;
      filter["values"] = [date,date];
      return(filter);
   }

   /**
    *
    * @param column     The table column
    * @param date       A date belonging to the given week
    * @param weekstart  First day of week. Default is monday
    * @returns          A filter representing this condition
    */
   public AtThisWeek(column:string, date:Date, weekstart?:WeekDays) : Filter
   {
      if (!weekstart)
         weekstart = WeekDays.Monday;

      let time:number = date.getTime();
      let offset:number = date.getDay() - weekstart;

      if (offset < 0) offset = 7 + offset;

      let d1:Date = new Date(time-offset*Dates.DAY);
      let d2:Date = new Date(d1.getTime() + 7 * Dates.DAY);

      let filter:Filter = new Filter();
      filter["type"] = "daterange";
      filter["column"] = column;
      filter["values"] = [d1,d2];
      return(filter);
   }

   /**
    * @param column     The table column
    * @param date       A date belonging to the given month
    * @returns          A filter representing this condition
    */
   public AtThisMonth(column:string, date:Date) : Filter
   {
      let d1:Date = new Date(date.getFullYear(),date.getMonth(),1);
      let d2:Date = new Date(date.getFullYear(),date.getMonth()+1,0,0,0);

      let filter:Filter = new Filter();
      filter["type"] = "daterange";
      filter["column"] = column;
      filter["values"] = [d1,d2];
      return(filter);
   }

   /**
    * @param column     The table column
    * @param date       A date belonging to the given year
    * @returns          A filter representing this condition
    */
   public AtThisYear(column:string, date:Date) : Filter
   {
      let d1:Date = new Date(date.getFullYear(),0);
      let d2:Date = new Date(date.getFullYear()+1,0,0,0,0,0,0);

      let filter:Filter = new Filter();
      filter["type"] = "daterange";
      filter["column"] = column;
      filter["values"] = [d1,d2];
      return(filter);
   }
}


export class Filters
{
   /**
    * Helper class to publish defined filters
    */
   public static Dates:Dates = new Dates();

   /**
    * @param column The column that must be null
    * @returns      An IsNull filter
    */
   public static IsNull(column:string) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "is null";
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that cannot be null
    * @returns      An IsNotNull filter
    */
   public static IsNotNull(column:string) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "is not null";
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that must be equal to the value
    * @param value  The value
    * @returns      An Equals filter
    */
   public static Equals(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "=";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that must differ from the value
    * @param value  The value
    * @returns      A NotEquals filter
    */
   public static NotEquals(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "!=";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that must match the value
    * @param value  The value
    * @returns      A Like filter
    */
   public static Like(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "like";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that cannot match the value
    * @param value  The value
    * @returns      A NotLike filter
    */
   public static NotLike(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "like";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that must be greater than the value
    * @param value  The value
    * @param equals Include the value itself
    * @returns      A GreaterThan filter
    */
   public static GreaterThan(column:string, value:any, equals?:boolean) : Filter
   {
      let type:string = ">";
      if (equals) type += "=";

      let filter:Filter = new Filter();
      filter["type"] = type;
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column The column that must be less than the value
    * @param value  The value
    * @param equals Include the value itself
    * @returns      A LessThan filter
    */
   public static LessThan(column:string, value:any, equals?:boolean) : Filter
   {
      let type:string = "<";
      if (equals) type += "=";

      let filter:Filter = new Filter();
      filter["type"] = type;
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column  The column that has fall within the interval
    * @param fr      The start value
    * @param to      The end value
    * @returns       A Between filter
    */
   public static Between(column:string, fr:any, to:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "between";
      filter["values"] = [fr,to];
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param column  The column that has fall outside the interval
    * @param fr      The start value
    * @param to      The end value
    * @returns       A NotBetween filter
    */
   public static NotBetween(column:string, fr:any, to:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "between";
      filter["values"] = [fr,to];
      filter["column"] = column;
      return(filter);
   }

   /**
    * @param columns Column or columns that must be within an array of values, maybe retrieved from the database
    * @param values  Array of values or a query to retrieve the array
    * @returns       An In filter
    */
   public static In(columns:string|string[], values:any[]|Query) : Filter
   {
      if (!Array.isArray(columns))
         columns = [columns];

      let filter:Filter = new Filter();
      filter["type"] = "in";
      filter["values"] = values;
      filter["columns"] = columns;
      return(filter);
   }

   /**
    * @param columns Column or columns that cannot be within a list of values, maybe retrieved from the database
    * @param values  List of values or a query to retrieve the list
    * @returns       An NotIn filter
    */
   public static NotIn(columns:string|string[], values:any[]|Query) : Filter
   {
      if (!Array.isArray(columns))
         columns = [columns];

      let filter:Filter = new Filter();
      filter["type"] = "not in";
      filter["values"] = values;
      filter["columns"] = columns;
      return(filter);
   }

   /**
    * @param columns Column or columns that exists in a list of values, maybe retrieved from the database
    * @param values  List of values or a query to retrieve the list
    * @returns       An Exist filter
    */
   public static Exists(columns:string|string[], values:any[]|Query) : Filter
   {
      if (!Array.isArray(columns))
         columns = [columns];

      let filter:Filter = new Filter();
      filter["type"] = "exists";
      filter["values"] = values;
      filter["columns"] = columns;
      return(filter);
   }

   /**
    * @param columns Column or columns that does not exists in a list of values, maybe retrieved from the database
    * @param values  List of values or a query to retrieve the list
    * @returns       An Exist filter
    */
   public static NotExists(columns:string|string[], values:any[]|Query) : Filter
   {
      if (!Array.isArray(columns))
         columns = [columns];

      let filter:Filter = new Filter();
      filter["type"] = "not exists";
      filter["values"] = values;
      filter["columns"] = columns;
      return(filter);
   }

   /**
    * The filter must match a filter defined in the backend
    * @param filter  The name of the custom filter
    * @param args    Name/value pair of arguments to the custom filter
    * @returns       A Custom filter
    */
   public static Custom(filter:string, args?:NameValuePair|NameValuePair[]) : Filter
   {
      let arr:NameValuePair[] = null;

      if (args)
      {
         if (!Array.isArray(args))
            args = [args];

         arr = args;
      }

      let custom:Filter = new Filter();
      custom["type"] = "custom";
      custom["custom"] = filter;
      custom["custargs"] = arr;
      return(custom);
   }
}


export class Filter
{
   /**
    * JSON Object that represents a condition in a where-clase
    */
   private type:string;
   private custom:string;

   private column:string;
   private columns:string[];

   private value:any = null;
   private values:any[]|Query = null;
   private custargs:NameValuePair[] = null;


   /**
    * @returns Whether the filter uses bindvalues
    */
   public args() : boolean
   {
      if (this.value != null) return(true);
      if (this.values != null) return(true);
      if (this.custargs.length > 0) return(true);
      return(false);
   }


   /**
    * Set the bindvalue(s)
    * @param values
    * @returns Itself
    */
   public bind(values:any|any[]) : Filter
   {
      if (values == null)
      {
         this.custargs = null;
         this.value = null;
         this.values = null;
         return(this);
      }

      if (this.type == "custom")
      {
         if (!Array.isArray(values))
            values = [values];

         this.custargs = values;
      }
      else
      {
         if (!Array.isArray(values)) this.value = values;
           else this.values = values;
      }

      return(this);
   }


   /**
    * @returns JSON Object representing the condition
    */
   public parse() : any
   {
      let parsed:any = {filter: this.type};

      if (this.column) parsed.column = this.column;
      if (this.columns) parsed.columns = this.columns;

      if (this.value) parsed.value = this.dconv(this.value);

      if (this.values)
      {
         if (this.values instanceof Query)
         {
            parsed.Table = this.values.getBasicRequest().Table;
         }
         else
         {
            parsed.values = this.dconv(this.values);
         }
      }

      if (this.type == "custom")
      {
         parsed = {custom: this.custom};

         if (this.custargs)
         {
            for (let i = 0; i < this.custargs.length; i++)
               parsed[this.custargs[i].name] = this.dconv(this.custargs[i].value);
         }
      }

      return(parsed);
   }


   private dconv(value:any) : any
   {
      if (value instanceof Date)
         value = value.toISOString();

      return(value);
   }
}


/**
 * Classic name/value pair
 */
export class NameValuePair
{
   public constructor(public name:string, public value:any) {};
}