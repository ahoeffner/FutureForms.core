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
   private static DAY:number = 1000*60*60*24;


   public AtThisDay(column:string, date?:Date) : Filter
   {
      if (!date) date = new Date();
      let filter:Filter = new Filter();
      filter["type"] = "daterange";
      filter["column"] = column;
      filter["values"] = [date,date];
      return(filter);
   }

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

   public static Dates:Dates = new Dates();

   public static IsNull(column:string) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "is null";
      filter["column"] = column;
      return(filter);
   }

   public static IsNotNull(column:string) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "is not null";
      filter["column"] = column;
      return(filter);
   }

   public static Equals(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "=";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   public static NotEquals(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "!=";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   public static Like(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "like";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

   public static NotLike(column:string, value:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "like";
      filter["value"] = value;
      filter["column"] = column;
      return(filter);
   }

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

   public static Between(column:string, fr:any, to:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "between";
      filter["values"] = [fr,to];
      filter["column"] = column;
      return(filter);
   }

   public static NotBetween(column:string, fr:any, to:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "between";
      filter["values"] = [fr,to];
      filter["column"] = column;
      return(filter);
   }

   public static In(column:string, values:any[]|Query) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "in";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static NotIn(column:string, values:any[]|Query) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "not in";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static Exists(column:string, values:any[]|Query) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "exists";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static NotExists(column:string, values:any[]|Query) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "not exists";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

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
   private type:string;
   private custom:string;

   private column:string;
   private columns:string[];

   private value:any = null;
   private values:any[]|Query = null;
   private custargs:NameValuePair[] = null;


   public args() : boolean
   {
      if (this.value != null) return(true);
      if (this.values != null) return(true);
      if (this.custargs.length > 0) return(true);
      return(false);
   }


   public bind(values:any|any[]) : void
   {
      if (values == null)
      {
         this.custargs = null;
         this.value = null;
         this.values = null;
         return;
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
   }


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
            parsed.Table = this.values.getBasicRequest();
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

      console.log(JSON.stringify(parsed))
      return(parsed);
   }


   private dconv(value:any) : any
   {
      if (value instanceof Date)
         value = value.toISOString();

      return(value);
   }
}


export class NameValuePair
{
   public constructor(public name:string, public value:any) {};
}