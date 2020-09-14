import { BitSet } from '../src'

describe('BitSet', () => {
  it('works', () => {
    const bitSet = new BitSet()
    bitSet.set(0)
    expect(bitSet.get(0)).toStrictEqual(1)
    expect(bitSet.getBoolean(0)).toBeTruthy()
    bitSet.set(0, 0)
    expect(bitSet.get(0)).toStrictEqual(0)
    expect(bitSet.getBoolean(0)).toBeFalsy()
    expect(bitSet.size).toStrictEqual(1)
    bitSet.setNumber(0, 7, 3)
    expect(bitSet.toBinaryString()).toStrictEqual('111')
    expect(bitSet.size).toStrictEqual(3)
    expect(bitSet.toNumber()).toStrictEqual(7)
    expect(bitSet.toUint8Array()).toEqual(Uint8Array.of(7))
    expect(bitSet.setBoolean(0)).toBeFalsy()
    expect(bitSet.get(-1)).toBeUndefined()
    expect(bitSet.set(8, 0)).toBeTruthy()
    expect(bitSet.getBoolean(42)).toBeUndefined()
    bitSet.setNumber(8, 42, 8)
    expect(bitSet.toBinaryString()).toStrictEqual('1110000000101010')
  })

  it('fromBinaryString', () => {
    const bitSet = BitSet.fromBinaryString('01100')
    expect(bitSet.toBinaryString()).toStrictEqual('01100')
  })

  it('fromUint8Array', () => {
    const array = Uint8Array.of(0, 1, 2)
    const bitSet = BitSet.fromUint8Array(array)
    expect(bitSet.toUint8Array()).toEqual(array)
  })

  it('resize', () => {
    const bitSet = BitSet.fromBinaryString('10111')
    bitSet.resize(8)
    expect(bitSet.toBinaryString()).toStrictEqual('10111000')
    bitSet.resize(3)
    expect(bitSet.toBinaryString()).toStrictEqual('101')
    bitSet.resize(0)
    expect(bitSet.toBinaryString()).toStrictEqual('')
    bitSet.resize(-1)
    expect(bitSet.size).toStrictEqual(0)
  })

  it('setString', () => {
    const bitSet = new BitSet()
    bitSet.setUtf8String(0, '0')
    expect(bitSet.toUint8Array()).toEqual(Uint8Array.of(48))
    bitSet.setUtf16String(0, '0')
    expect(bitSet.toUint8Array()).toEqual(Uint8Array.of(0, 48))
    bitSet.set(32)
    expect(bitSet.toBinaryString()).toStrictEqual(
      '000000000011000000000000000000001'
    )
  })

  it('slice', () => {
    const bitSet = BitSet.fromBinaryString('001110101')
    expect(bitSet.slice(-1)).toBeUndefined()
    expect(bitSet.slice(2, 0)).toBeUndefined()
    expect(bitSet.slice(0)?.toBinaryString()).toStrictEqual('001110101')
    expect(bitSet.slice(3, 6)?.toBinaryString()).toStrictEqual('1101')
    expect(bitSet.slice(7, 10)?.toBinaryString()).toStrictEqual('0100')
  })
})
