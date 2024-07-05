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


export class Filters
{
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

   public static In(column:string, values:any[]) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "in";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static NotIn(column:string, values:any[]) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "not in";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static Exists(column:string, values:any[]) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "exists";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static NotExists(column:string, values:any[]) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "not exists";
      filter["values"] = values;
      filter["column"] = column;
      return(filter);
   }

   public static Custom(column:string, payload:any) : Filter
   {
      let filter:Filter = new Filter();
      filter["type"] = "custom";
      filter["payload"] = payload;
      filter["column"] = column;
      return(filter);
   }
}

export class Filter
{
   private type:string;
   private payload:any;

   private column:string;
   private columns:string[];

   private value:any;
   private values:any[];

   public parse() : any
   {
      let parsed:any = {type: this.type};

      if (this.column) parsed.column = this.column;
      if (this.columns) parsed.columns = this.columns;

      if (this.value) parsed.value = this.value;
      if (this.values) parsed.values = this.values;

      if (this.type == "custom")
      {
         if (this.payload)
         {
            Object.keys(parsed).forEach((attr) =>
            {parsed[attr] = this.payload[attr];})
         }
      }

      return(parsed);
   }
}