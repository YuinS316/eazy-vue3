//  有限状态机
export const enum State {
  //  初始状态
  INITIAL,
  //  标签开始状态
  TAG_OPEN,
  //  标签名称状态
  TAG_NAME,
  //  文本状态
  TEXT,
  //  结束标签状态
  TAG_END,
  //  结束标签名称状态
  TAG_END_NAME,
}

export interface TagToken {
  type: "tag";
  name: string;
}

export interface TextToken {
  type: "text";
  content: string;
}

export interface TagEndToken {
  type: "tagEnd";
  name: string;
}

export type Token = TagToken | TextToken | TagEndToken;

/**
 * 判断是否是英文字母
 * @param char
 * @returns
 */
function isLetter(char: string) {
  return /[a-zA-Z]/.test(char);
}

//  接受模板字符串作为参数，切割模版为token返回
export function tokenize(str: string) {
  let currentState: State = State.INITIAL;
  //  缓存字符
  const chars: string[] = [];
  //  生成的token会存储到这里
  const tokens: Token[] = [];

  while (str) {
    //  查看第一个字符
    const char = str[0];

    switch (currentState) {
      case State.INITIAL: {
        if (char === "<") {
          //  遇到 '<' 转到标签打开的情况
          currentState = State.TAG_OPEN;
          //  消费字符
          str = str.slice(1);
        } else if (isLetter(char)) {
          //  遇到字母，切换到文本状态
          currentState = State.TEXT;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      }

      case State.TAG_OPEN: {
        if (isLetter(char)) {
          //  遇到字母，切换到标签名称状态
          //  <header
          currentState = State.TAG_NAME;
          chars.push(char);
          str = str.slice(1);
        } else if (char === "/") {
          //  遇到结束标签
          //  </header
          currentState = State.TAG_END;
          str = str.slice(1);
        }
        break;
      }

      case State.TAG_NAME: {
        if (isLetter(char)) {
          //  遇到字母，继续解析
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          //  遇到 '>' 切换到初始状态，此时一个标签已解析完成
          //  把chars存到 tokens 后再清空chars
          currentState = State.INITIAL;
          tokens.push({
            type: "tag",
            name: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }

        break;
      }

      case State.TEXT: {
        if (isLetter(char)) {
          //  遇到字母继续解析
          chars.push(char);
          str = str.slice(1);
        } else if (char === "<") {
          //  遇到 '<' 切换到标签打开模式
          //  同时解析完成
          currentState = State.TAG_OPEN;
          tokens.push({
            type: "text",
            content: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      }

      case State.TAG_END: {
        if (isLetter(char)) {
          //  遇到这种情况 </(h)eader
          currentState = State.TAG_END_NAME;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      }

      case State.TAG_END_NAME: {
        if (isLetter(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === ">") {
          currentState = State.INITIAL;
          tokens.push({
            type: "tagEnd",
            name: chars.join(""),
          });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      }
    }
  }

  return tokens;
}
