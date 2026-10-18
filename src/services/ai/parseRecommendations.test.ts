import { describe, expect, it } from 'vitest'
import { AiRequestError } from './aiErrors'
import { parseRecommendations } from './parseRecommendations'

const item = (n: number) => ({ title: `Title ${n}`, detail: `Detail ${n}` })

describe('parseRecommendations', () => {
  it('reads plain JSON', () => {
    expect(parseRecommendations(JSON.stringify({ recommendations: [item(1)] }))).toEqual([item(1)])
  })

  it('reads JSON inside a code fence or prose', () => {
    const text = 'Sure! ```json\n' + JSON.stringify({ recommendations: [item(1), item(2)] }) + '\n```'
    expect(parseRecommendations(text)).toEqual([item(1), item(2)])
  })

  it('keeps at most 4 and trims long text', () => {
    const long = { title: 'x'.repeat(500), detail: 'y'.repeat(900) }
    const result = parseRecommendations(
      JSON.stringify({ recommendations: [long, item(2), item(3), item(4), item(5)] }),
    )
    expect(result).toHaveLength(4)
    expect(result[0].title).toHaveLength(120)
    expect(result[0].detail).toHaveLength(400)
  })

  it.each(['no json here', '{"recommendations": []}', '{"recommendations": [{"title": ""}]}', '{broken'])(
    'rejects unusable answers: %s',
    (text) => {
      expect(() => parseRecommendations(text)).toThrow(new AiRequestError('bad-response'))
    },
  )
})
