import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import fs from "fs";
import Url from 'url';
import * as crypto from 'crypto';
import { Schema, Document, Model } from 'mongoose';
import { InjectModel } from "@nestjs/mongoose";
import { Counter, CounterDocument } from "../../entities/counter.entity";

@Injectable()
export class UtilService {
  constructor() {
  }
  private serialNumberCounter = 1000;
  /**
   * Remove a file from the directory.
   * @param file string
   * @returns Boolean
   */
  static removeFile(file: string) {
    if (!file) {
      return true;
    }

    if (!fs.existsSync(file)) {
      return true;
    }

    return fs.unlink(file, (err) => {
      if (err) {
        return false;
      }
      return true;
    });
  }

  /**
   * 
   * @param files Array of file names to  bbe removed from directory.
   * @returns 
   */
  static removeFiles(files: Array<string>): Boolean {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.removeFile(file);
    }
    return true;
  }

  /**
   * Generate a random id of desired length using passed characters.
   * @param length The length of generated id.
   * @param characters Characters to use for id generation.
   * @returns A random id.
   */
  static generateAnId(length: number, characters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"): string {
    let result = "";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  static cleanAndUniqueFileName(fileName: string): string {
    const fileNameArray = fileName.split(".");
    const ext = fileNameArray[fileNameArray.length - 1];
    fileNameArray.pop();
    const fileNameOnly = fileNameArray.join("-")
      .replace(/[^A-Z0-9]+/ig, "_")
      .slice(0, 200);

    const newName = fileNameOnly + "_" + Date.now() + "." + ext;
    return newName;
  }

  static createSlug(title: string): string {
    return title.replace(/[^A-Z0-9]+/ig, "-").slice(0, 200);
  }

  /**
   * It compares two arrays and returns missing elements of which don't exist in b. For example if a=[0,1,2,3,4] and b=[2,3,4,5,6] return will be [0, 1].
   * @param a An array of strings. Missing elements from this array will be returned.
   * @param b An array of strings. These elements will be compared with a.
   * @returns Array of strings
   */
  static arrayDiff(a: string[], b: string[]): string[] {
    return a.filter(item => b.indexOf(item) === -1);
  }

  async generateUid(clientID: number, itemID: number,): Promise<string> {
    if (clientID === undefined || itemID === undefined) {
      throw new Error('clientID or itemID is undefined');
    }
  
    const now = new Date();
    const datePart = now.toISOString().split('T')[0].replace(/-/g, '');
  
    const formattedClientID = clientID.toString().padStart(2, '0'); 
    const formattedItemID = itemID.toString().padStart(2, '0'); 
  
    // Calculate checksum digit (basic example: sum of all digits % 10)
    const checksumData = `${datePart}${formattedClientID}${formattedItemID}`;
    const checksumDigit = this.calculateChecksum(checksumData);
  
    const uniqueId = `${datePart}-${formattedClientID}-${formattedItemID}-${checksumDigit}`;
    return uniqueId;
  }
  
  calculateChecksum(data: string): number {
    const sum = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return sum % 10; 
  }



  // Method to get a brand abbreviation (assuming brand name is passed)
  // getBrandAbbreviation(brandName: string): string {
  //   return brandName.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
  // }

  // generateChecksum(title: string, brandName: string): string {
  //   const data = `${title}_${brandName}`;
  //   const checksum = crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
  //   const uniqueId = `${title}_${brandName}_${checksum}`;
  //   return uniqueId;
  // }

  static removeQueryString(url: string): string {
    const parsedUrl = new URL(url);
    parsedUrl.search = '';
    return parsedUrl.toString();
  }
}
