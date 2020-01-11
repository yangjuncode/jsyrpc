export function isCallbackInMap(key: string, callBack: Function, _map: Map<string, Function[]>): boolean {
  let mapItem = _map.get(key)

  if (!mapItem) {
    return false
  }

  return mapItem.includes(callBack)
}

export function addCallback2Map(key: string, callBack: Function, _map: Map<string, Function[]>) {
  let calbacks = _map.get(key)
  if (!calbacks) {
    calbacks = [callBack]
  } else {
    calbacks.push(callBack)
  }
  _map.set(key, calbacks)
}

export function delCallbackFromMap(key: string, callBack: Function, _map: Map<string, Function[]>) {
  let calbacks = _map.get(key)
  if (!calbacks) {
    return
  }
  calbacks = calbacks.filter(
      function (v: any): boolean {
        return v !== callBack

      })
  _map.set(key, calbacks)
}
