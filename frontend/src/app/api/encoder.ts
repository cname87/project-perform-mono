import * as http from '@angular/common/http';

/**
 * CustomHttpUrlEncodingCodec
 * Fix plus sign (+) not encoding, so +'s are sent as a blank space (as + is a reserved character) by encoding a plus sign (+) as %2B (which is the url coding for a plus sign (+)).
 * See: https://github.com/angular/angular/issues/11058#issuecomment-247367318
 */
export class CustomHttpUrlEncodingCodec extends http.HttpUrlEncodingCodec {
  encodeValue(v: string): string {
    v = super.encodeValue(v);
    return v.replace(/\+/gi, '%2B');
  }

  /* uncomment if you want a query key containing a '+' */
  // encodeKey(k: string): string {
  //   k = super.encodeKey(k);
  //   return k.replace(/\+/gi, '%2B');
  // }
}
