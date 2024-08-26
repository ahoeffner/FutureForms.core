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

import { Filter } from "./Filters.js";


export class FilterGroup
{
   private entries$:Entry[] = [];


   public static group(filters:Filter|Filter[]|FilterGroup|FilterGroup[]) : FilterGroup
   {
      if (filters == null)
         return(null);

      if (filters instanceof FilterGroup)
         return(filters);

      return(new FilterGroup(filters));
   }


   public constructor(filters?:Filter|Filter[]|FilterGroup[])
   {
      if (filters)
      {
         if (!Array.isArray(filters)) filters = [filters];
         for (let i = 0; i < filters.length; i++) this.add(filters[i]);
      }
   }


   public add(filter:Filter|FilterGroup) : FilterGroup
   {
      this.entries$.push(new Entry("and",filter));
      return(this);
   }


   public or(filter:Filter|FilterGroup) : FilterGroup
   {
      this.entries$.push(new Entry("or",filter));
      return(this);
   }


   public parse() : any
   {
      let parsed:any[] = [];

      if (this.entries$.length == 0)
         return(null);

      parsed.push(this.entries$[0].filter.parse());

      for (let i = 1; i < this.entries$.length; i++)
         parsed.push({[this.entries$[i].opr]: this.entries$[i].filter.parse()});

      return(parsed);
   }


   public bind(...values:any) : void
   {
      let arg:number = 0;
      if (values) values = values[0];
      let filters:Filter[] = this.filters();

      if (values.length == 0)
         return;

      for (let i = 0; i < filters.length; i++)
      {
         if (filters[i].args())
            filters[i].bind(values[arg++])
      }
   }


   public filters() : Filter[]
   {
      let filters:Filter[] = [];

      if (this.entries$.length == 0)
         return(null);

      for (let i = 0; i < this.entries$.length; i++)
      {
         let entry:Entry = this.entries$[i];

         if (entry.filter instanceof Filter)
         {
            filters.push(entry.filter);
         }
         else
         {
            filters.push(...entry.filter.filters());
         }
      }

      return(filters);
   }
}


class Entry
{
   constructor(public opr:string, public filter:Filter|FilterGroup) {}
}