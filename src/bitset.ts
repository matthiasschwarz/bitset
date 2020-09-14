const WORD_SIZE = 32
const WORD_SIZE_LOG = 5

function reverseString(string: string): string {
  return string
    .split('')
    .reverse()
    .join('')
}

export class BitSet {
  private readonly _data: Array<Uint32Array>

  private _size: number
  get size() {
    return this._size
  }

  constructor() {
    this._data = []
    this._size = 0
  }

  protected indexInRange(index: number): boolean {
    return index >= 0 && index < this._size
  }

  protected wordIndex(index: number): number {
    return index >>> WORD_SIZE_LOG
  }

  protected scaleUp(index: number) {
    const words = this.wordIndex(index)
    for (let i = this._data.length; i <= words; ++i)
      this._data.push(new Uint32Array(1))
    this._size = index + 1
  }

  protected scaleDown(index: number) {
    if (index <= 0) {
      this._data.splice(0, Number.MAX_SAFE_INTEGER)
      this._size = 0
    } else {
      const words = this.wordIndex(index)
      this._data.splice(words + 1, Number.MAX_SAFE_INTEGER)
      const bitsLeft = WORD_SIZE - (index % WORD_SIZE) - 1
      this._data[words][0] = (this._data[words][0] << bitsLeft) >>> bitsLeft
      this._size = index + 1
    }
  }

  protected setBit(index: number, change: (value: number) => number): boolean {
    const wordIndex = this.wordIndex(index)
    const oldValue = this._data[wordIndex][0]
    const newValue = change(oldValue)
    if (oldValue !== newValue) {
      this._data[wordIndex][0] = newValue
      return true
    }
    return false
  }

  protected setTrue(index: number) {
    return this.setBit(index, value => value | (1 << index))
  }

  protected setFalse(index: number) {
    return this.setBit(index, value => value & ~(1 << index))
  }

  /**
   * New BitSet from binary string
   * @param string
   */
  static fromBinaryString(string: string): BitSet {
    const bitSet = new BitSet()
    bitSet.setBinaryString(0, string)
    return bitSet
  }

  /**
   * New BitSet from Uint8Array
   * @param array
   */
  static fromUint8Array(array: Uint8Array): BitSet {
    const bitSet = new BitSet()
    bitSet.setUint8Array(0, array)
    return bitSet
  }

  resize(size: number) {
    if (size > this._size) this.scaleUp(size - 1)
    else if (size < this._size && size >= 0) this.scaleDown(size - 1)
  }

  /**
   * Get bit at index
   * @param index
   * @returns bit as number or undefined when index is out of range
   */
  get(index: number): number | undefined {
    if (!this.indexInRange(index)) return
    return (this._data[index >>> WORD_SIZE_LOG][0] >>> index) & 1
  }

  /**
   * Get bit at index
   * @param index
   * @returns bit as boolean or undefined when index is out of range
   */
  getBoolean(index: number): boolean | undefined {
    const n = this.get(index)
    return n !== undefined ? n === 1 : undefined
  }

  /**
   * Set bit at index
   * @param index
   * @param value
   * @returns true when bit at index changed otherwise false
   */
  set(index: number, value = 1): boolean {
    return this.setBoolean(index, value === 1)
  }

  /**
   * Set bit at index
   * @param index
   * @param value
   * @returns true when bit at index changed otherwise false
   */
  setBoolean(index: number, value = true): boolean {
    if (this.indexInRange(index)) {
      return value ? this.setTrue(index) : this.setFalse(index)
    } else {
      this.scaleUp(index)
      if (value) this.setTrue(index)
      return true
    }
  }

  protected setUnchecked(index: number, value: number): boolean {
    return value === 1 ? this.setTrue(index) : this.setFalse(index)
  }

  protected setString(
    bitOffset: number,
    value: string,
    characterBitSize: number
  ) {
    this.scaleUp(bitOffset + value.length * characterBitSize - 1)
    for (let i = 0; i < value.length; ++i) {
      this.setBinaryStringUnchecked(
        bitOffset + i * characterBitSize,
        value
          .charCodeAt(i)
          .toString(2)
          .padStart(characterBitSize, '0')
      )
    }
  }

  /**
   * Set bits from utf-16 string
   * @param bitOffset
   * @param value
   */
  setUtf16String(bitOffset: number, value: string) {
    this.setString(bitOffset, value, 16)
  }

  /**
   * Set bits from utf-8 string
   * @param bitOffset
   * @param value
   */
  setUtf8String(bitOffset: number, value: string) {
    this.setString(bitOffset, value, 8)
  }

  /**
   * Set bits from binary string
   * Indices are set from left to right
   * @param bitOffset
   * @param value
   */
  setBinaryString(bitOffset: number, value: string) {
    this.scaleUp(bitOffset + value.length - 1)
    this.setBinaryStringUnchecked(bitOffset, value)
  }

  setNumber(bitOffset: number, value: number, bitSize: number) {
    this.scaleUp(bitOffset + bitSize - 1)
    this.setBinaryStringUnchecked(
      bitOffset,
      value.toString(2).padStart(bitSize, '0')
    )
  }

  setUint8Array(bitOffset: number, value: Uint8Array) {
    this.scaleUp(bitOffset + value.length * 8 - 1)
    for (let i = 0; i < value.length; i++) {
      this.setBinaryStringUnchecked(
        bitOffset + i * 8,
        value[i].toString(2).padStart(8, '0')
      )
    }
  }

  protected setBinaryStringUnchecked(bitOffset: number, value: string) {
    for (let i = 0; i < value.length; ++i)
      this.setUnchecked(bitOffset + i, parseInt(value.charAt(i)))
  }

  slice(start: number, end: number = this._size - 1): BitSet | undefined {
    if (!this.indexInRange(start) || start >= end) return
    let binary = this.toBinaryString().substring(start, end + 1)
    if (!this.indexInRange(end)) binary = binary.padEnd(end - start + 1, '0')
    return BitSet.fromBinaryString(binary)
  }

  toBinaryString(): string {
    let binary = ''
    const end = Math.floor(this._size / WORD_SIZE)
    for (let i = 0; i < end; ++i)
      binary += reverseString(this._data[i][0].toString(2)).padEnd(
        WORD_SIZE,
        '0'
      )
    const bitLeft = this._size % WORD_SIZE
    if (bitLeft !== 0) {
      binary += reverseString(this._data[end][0].toString(2)).padEnd(
        bitLeft,
        '0'
      )
    }
    return binary
  }

  toUint8Array(): Uint8Array {
    const array = new Uint8Array(Math.ceil(this._size / 8))
    const binary = this.toBinaryString()
    for (let i = 0, j = 0; j < binary.length; ++i, j += 8)
      array[i] = parseInt(binary.substr(j, 8), 2)
    return array
  }

  toNumber(): number {
    return parseInt(this.toBinaryString(), 2)
  }
}
